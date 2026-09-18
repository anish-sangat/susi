from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from uuid import UUID, uuid4

import portone_server_sdk as portone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.config import settings
from app.db.database import get_db
from app.models.order import ShopOrder
from app.models.payment import OrderPayment, PaymentEvent, PaymentType
from app.models.user import SiteUser
from app.schemas.payment import (
    PaymentCreateResponse,
    PaymentResponse,
    PaymentVerifyRequest,
)
from app.services.payment import (
    complete_order_payment,
    fail_order_payment,
)
from app.services.portone import get_payment


router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)


def get_portone_amount(portone_payment: dict) -> Decimal:
    amount = portone_payment.get("amount")

    if isinstance(amount, dict):
        amount = amount.get("total")

    if amount is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="PortOne payment amount is missing",
        )

    try:
        return Decimal(str(amount))
    except (InvalidOperation, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid payment amount returned by PortOne",
        )


def validate_paid_payment(
    portone_payment: dict,
    payment: OrderPayment,
    order: ShopOrder,
) -> None:
    portone_status = portone_payment.get("status")

    if portone_status != "PAID":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment has not been completed",
        )

    verified_amount = get_portone_amount(portone_payment)

    if verified_amount != payment.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount does not match",
        )

    if payment.amount != order.total_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stored payment amount does not match order",
        )

    currency = portone_payment.get("currency")

    if currency is not None and currency != payment.currency:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment currency does not match",
        )


def mark_payment_paid(
    db: Session,
    payment: OrderPayment,
    order: ShopOrder,
    portone_payment: dict,
) -> None:
    if payment.status == "paid":
        return

    validate_paid_payment(
        portone_payment=portone_payment,
        payment=payment,
        order=order,
    )

    complete_order_payment(
        db=db,
        order_id=order.id,
    )

    payment.status = "paid"


# IMPORTANT:
# Static routes such as /verify and /webhook are defined BEFORE /{order_id}.
# This prevents the dynamic UUID route from interfering with them.


@router.post(
    "/verify",
    response_model=PaymentResponse,
)
def verify_payment(
    data: PaymentVerifyRequest,
    db: Session = Depends(get_db),
    current_user: SiteUser = Depends(get_current_user),
):
    payment = db.scalar(
        select(OrderPayment)
        .where(
            OrderPayment.provider == "portone",
            OrderPayment.provider_payment_id == data.payment_id,
        )
        .with_for_update()
    )

    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )

    order = db.scalar(
        select(ShopOrder)
        .where(
            ShopOrder.id == payment.order_id,
            ShopOrder.user_id == current_user.id,
        )
        .with_for_update()
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    if payment.status == "paid":
        return PaymentResponse(
            payment_id=payment.id,
            order_id=order.id,
            provider=payment.provider,
            provider_payment_id=payment.provider_payment_id,
            amount=payment.amount,
            currency=payment.currency,
            status=payment.status,
        )

    if payment.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment is not pending",
        )

    portone_payment = get_payment(
        payment.provider_payment_id
    )

    mark_payment_paid(
        db=db,
        payment=payment,
        order=order,
        portone_payment=portone_payment,
    )

    db.commit()
    db.refresh(payment)

    return PaymentResponse(
        payment_id=payment.id,
        order_id=order.id,
        provider=payment.provider,
        provider_payment_id=payment.provider_payment_id,
        amount=payment.amount,
        currency=payment.currency,
        status=payment.status,
    )


@router.post(
    "/webhook",
    status_code=status.HTTP_200_OK,
)
async def portone_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    # PortOne signature verification requires the ORIGINAL raw body.
    raw_body = await request.body()

    try:
        webhook = portone.webhook.verify(
            settings.portone_webhook_secret,
            raw_body.decode("utf-8"),
            request.headers,
        )
    except portone.webhook.WebhookVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature",
        )

    # PortOne may return a dictionary for an event type that the
    # installed SDK version does not recognize.
    if isinstance(webhook, dict):
        return {
            "status": "ignored",
        }

    # We only need transaction-related webhooks here.
    if not isinstance(
        webhook.data,
        portone.webhook.WebhookTransactionData,
    ):
        return {
            "status": "ignored",
        }

    payment_id = webhook.data.payment_id

    if not payment_id:
        return {
            "status": "ignored",
        }

    # Standard Webhooks supplies a stable webhook ID.
    webhook_id = request.headers.get("webhook-id")

    if webhook_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing webhook ID",
        )

    # Prevent processing the same webhook twice.
    existing_event = db.scalar(
        select(PaymentEvent).where(
            PaymentEvent.provider_event_id == webhook_id
        )
    )

    if existing_event is not None:
        return {
            "status": "already_processed",
        }

    payment = db.scalar(
        select(OrderPayment)
        .where(
            OrderPayment.provider == "portone",
            OrderPayment.provider_payment_id == payment_id,
        )
        .with_for_update()
    )

    # The webhook may refer to a payment that SUSI does not know about.
    # We acknowledge it instead of repeatedly making PortOne retry it.
    if payment is None:
        return {
            "status": "ignored",
        }

    order = db.scalar(
        select(ShopOrder)
        .where(
            ShopOrder.id == payment.order_id
        )
        .with_for_update()
    )

    if order is None:
        return {
            "status": "ignored",
        }

    # Never trust the webhook itself as proof that money was paid.
    # Fetch the authoritative payment state directly from PortOne.
    portone_payment = get_payment(payment_id)

    portone_status = portone_payment.get("status")

    if portone_status == "PAID":
        if payment.status == "pending":
            mark_payment_paid(
                db=db,
                payment=payment,
                order=order,
                portone_payment=portone_payment,
            )

    elif portone_status in {
        "FAILED",
        "CANCELLED",
    }:
        if (
            payment.status == "pending"
            and order.status_id == 1
        ):
            fail_order_payment(
                db=db,
                order_id=order.id,
            )

            if portone_status == "FAILED":
                payment.status = "failed"
            else:
                payment.status = "cancelled"

    event_type = getattr(
        webhook,
        "type",
        "unknown",
    )

    # Save the verified webhook for audit/idempotency.
    # Store only the information we actually need instead of trying
    # to JSON-serialize the SDK's custom Python object.
    event_payload = {
        "type": str(event_type),
        "paymentId": payment_id,
        "webhookId": webhook_id,
    }

    event = PaymentEvent(
        provider="portone",
        provider_event_id=webhook_id,
        event_type=str(event_type),
        payload=event_payload,
        processed_at=datetime.now(timezone.utc),
    )

    db.add(event)

    try:
        db.commit()

    except IntegrityError:
        db.rollback()

        # Another worker may have processed the same webhook
        # at exactly the same time.
        duplicate = db.scalar(
            select(PaymentEvent).where(
                PaymentEvent.provider_event_id == webhook_id
            )
        )

        if duplicate is not None:
            return {
                "status": "already_processed",
            }

        raise

    return {
        "status": "processed",
    }


@router.post(
    "/{order_id}",
    response_model=PaymentCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_payment(
    order_id: UUID,
    db: Session = Depends(get_db),
    current_user: SiteUser = Depends(get_current_user),
):
    order = db.scalar(
        select(ShopOrder)
        .where(
            ShopOrder.id == order_id,
            ShopOrder.user_id == current_user.id,
        )
        .with_for_update()
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    if order.status_id != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is not pending payment",
        )

    now = datetime.now(timezone.utc)

    if (
        order.reservation_expires_at is not None
        and order.reservation_expires_at <= now
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order payment reservation has expired",
        )

    payment_type = db.scalar(
        select(PaymentType).where(
            PaymentType.code == "card",
            PaymentType.is_active == True,
        )
    )

    if payment_type is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Card payment type is not configured",
        )

    existing_payment = db.scalar(
        select(OrderPayment).where(
            OrderPayment.order_id == order.id,
            OrderPayment.status == "pending",
        )
    )

    if existing_payment is not None:
        return PaymentCreateResponse(
            payment_id=existing_payment.id,
            order_id=order.id,
            payment_reference=existing_payment.provider_payment_id,
            amount=existing_payment.amount,
            currency=existing_payment.currency,
            status=existing_payment.status,
        )

    # This value must later be passed to PortOne's browser SDK
    # as paymentId.
    payment_reference = f"susi-{uuid4()}"

    payment = OrderPayment(
        order_id=order.id,
        payment_type_id=payment_type.id,
        provider="portone",
        provider_payment_id=payment_reference,
        amount=order.total_amount,
        currency=order.currency,
        status="pending",
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    return PaymentCreateResponse(
        payment_id=payment.id,
        order_id=order.id,
        payment_reference=payment.provider_payment_id,
        amount=payment.amount,
        currency=payment.currency,
        status=payment.status,
    )