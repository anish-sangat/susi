from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.order import ShopOrder
from app.models.order_line import OrderLine
from app.models.order_status_history import OrderStatusHistory
from app.services.inventory import complete_sale, release_stock


PENDING_STATUS_ID = 1
PAID_STATUS_ID = 2
FAILED_STATUS_ID = 6


def complete_order_payment(
    db: Session,
    order_id: UUID,
) -> None:
    order = db.scalar(
        select(ShopOrder)
        .where(ShopOrder.id == order_id)
        .with_for_update()
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    if order.status_id != PENDING_STATUS_ID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is not pending payment",
        )

    order_lines = db.scalars(
        select(OrderLine)
        .where(OrderLine.order_id == order.id)
    ).all()

    if not order_lines:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order has no items",
        )

    # Stock was already reserved when the order was created.
    # Completing the sale must not reduce available stock again.
    for line in order_lines:
        complete_sale(
            db=db,
            product_item_id=line.product_item_id,
            quantity=line.quantity,
            order_id=order.id,
        )

    order.status_id = PAID_STATUS_ID
    order.reservation_expires_at = None

    db.add(
        OrderStatusHistory(
            order_id=order.id,
            status_id=PAID_STATUS_ID,
            note="Payment confirmed",
        )
    )


def fail_order_payment(
    db: Session,
    order_id: UUID,
) -> None:
    order = db.scalar(
        select(ShopOrder)
        .where(ShopOrder.id == order_id)
        .with_for_update()
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    if order.status_id != PENDING_STATUS_ID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is not pending payment",
        )

    order_lines = db.scalars(
        select(OrderLine)
        .where(OrderLine.order_id == order.id)
    ).all()

    if not order_lines:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order has no items",
        )

    # Payment failed, so return the reserved quantity
    # to available inventory.
    for line in order_lines:
        release_stock(
            db=db,
            product_item_id=line.product_item_id,
            quantity=line.quantity,
            order_id=order.id,
        )

    order.status_id = FAILED_STATUS_ID
    order.reservation_expires_at = None

    db.add(
        OrderStatusHistory(
            order_id=order.id,
            status_id=FAILED_STATUS_ID,
            note="Payment failed",
        )
    )