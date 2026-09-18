
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.database import get_db
from app.models.catalog import Product, ProductItem
from app.models.cart import ShoppingCart, ShoppingCartItem
from app.models.order import ShopOrder
from app.models.order_address import OrderAddress
from app.models.order_line import OrderLine
from app.models.order_status import OrderStatus, ShippingMethod
from app.models.order_status_history import OrderStatusHistory
from app.models.user import SiteUser
from app.schemas.order import OrderCreate, OrderResponse
from app.services.inventory import reserve_stock


router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)


RESERVATION_MINUTES = 15


def build_order_response(
    order: ShopOrder,
    db: Session,
) -> OrderResponse:

    lines = db.scalars(
        select(OrderLine)
        .where(OrderLine.order_id == order.id)
    ).all()

    addresses = db.scalars(
        select(OrderAddress)
        .where(OrderAddress.order_id == order.id)
    ).all()

    return OrderResponse(
        id=order.id,
        order_number=order.order_number,
        user_id=order.user_id,
        status_id=order.status_id,
        shipping_method_id=order.shipping_method_id,
        customer_email=order.customer_email,
        currency=order.currency,
        subtotal=order.subtotal,
        discount_amount=order.discount_amount,
        shipping_amount=order.shipping_amount,
        tax_amount=order.tax_amount,
        total_amount=order.total_amount,
        notes=order.notes,
        reservation_expires_at=order.reservation_expires_at,
        lines=lines,
        addresses=addresses,
    )


@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: SiteUser = Depends(get_current_user),
):
    cart = db.scalar(
        select(ShoppingCart)
        .where(
            ShoppingCart.user_id == current_user.id
        )
        .with_for_update()
    )

    if cart is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart not found",
        )

    cart_items = db.scalars(
        select(ShoppingCartItem)
        .where(
            ShoppingCartItem.cart_id == cart.id
        )
        .with_for_update()
    ).all()

    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty",
        )

    shipping_method = db.scalar(
        select(ShippingMethod)
        .where(
            ShippingMethod.id == data.shipping_method_id,
            ShippingMethod.is_active == True,
        )
    )

    if shipping_method is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid shipping method",
        )

    product_items = []

    for cart_item in cart_items:
        product_item = db.scalar(
            select(ProductItem)
            .where(
                ProductItem.id == cart_item.product_item_id,
                ProductItem.is_active == True,
            )
            .with_for_update()
        )

        if product_item is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more products are no longer available",
            )

        product = db.scalar(
            select(Product)
            .where(
                Product.id == product_item.product_id,
                Product.is_active == True,
            )
        )

        if product is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more products are no longer available",
            )

        if product_item.qty_in_stock < cart_item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for SKU {product_item.sku}",
            )

        product_items.append(
            (
                cart_item,
                product_item,
                product,
            )
        )

    subtotal = Decimal("0.00")

    for cart_item, product_item, product in product_items:
        subtotal += (
            product_item.price
            * cart_item.quantity
        )

    discount_amount = Decimal("0.00")

    shipping_amount = Decimal(
        shipping_method.price
    )

    tax_amount = Decimal("0.00")

    total_amount = (
        subtotal
        - discount_amount
        + shipping_amount
        + tax_amount
    )

    if total_amount < 0:
        total_amount = Decimal("0.00")

    pending_status = db.scalar(
        select(OrderStatus)
        .where(
            OrderStatus.id == 1
        )
    )

    if pending_status is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Pending order status is not configured",
        )

    now = datetime.now(timezone.utc)

    reservation_expires_at = (
        now + timedelta(minutes=RESERVATION_MINUTES)
    )

    order = ShopOrder(
        user_id=current_user.id,
        status_id=pending_status.id,
        shipping_method_id=shipping_method.id,
        customer_email=current_user.email,
        currency="KRW",
        subtotal=subtotal,
        discount_amount=discount_amount,
        shipping_amount=shipping_amount,
        tax_amount=tax_amount,
        total_amount=total_amount,
        notes=data.notes,
        reservation_expires_at=reservation_expires_at,
    )

    db.add(order)
    db.flush()

    shipping_address = OrderAddress(
        order_id=order.id,
        address_type="shipping",
        recipient_name=data.shipping_address.recipient_name,
        phone_number=data.shipping_address.phone_number,
        postal_code=data.shipping_address.postal_code,
        city=data.shipping_address.city,
        district=data.shipping_address.district,
        address_line1=data.shipping_address.address_line1,
        address_line2=data.shipping_address.address_line2,
    )

    db.add(shipping_address)

    if data.billing_address is not None:
        billing_address = OrderAddress(
            order_id=order.id,
            address_type="billing",
            recipient_name=data.billing_address.recipient_name,
            phone_number=data.billing_address.phone_number,
            postal_code=data.billing_address.postal_code,
            city=data.billing_address.city,
            district=data.billing_address.district,
            address_line1=data.billing_address.address_line1,
            address_line2=data.billing_address.address_line2,
        )

        db.add(billing_address)

    for cart_item, product_item, product in product_items:

        reserve_stock(
            db=db,
            product_item_id=product_item.id,
            quantity=cart_item.quantity,
            order_id=order.id,
        )

        order_line = OrderLine(
            order_id=order.id,
            product_item_id=product_item.id,
            product_name=product.name,
            sku=product_item.sku,
            quantity=cart_item.quantity,
            unit_price=product_item.price,
            line_total=(
                product_item.price
                * cart_item.quantity
            ),
        )

        db.add(order_line)

    status_history = OrderStatusHistory(
        order_id=order.id,
        status_id=pending_status.id,
    )

    db.add(status_history)

    for cart_item in cart_items:
        db.delete(cart_item)

    db.commit()
    db.refresh(order)

    return build_order_response(
        order=order,
        db=db,
    )


@router.get(
    "",
    response_model=list[OrderResponse],
)
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: SiteUser = Depends(get_current_user),
):
    orders = db.scalars(
        select(ShopOrder)
        .where(
            ShopOrder.user_id == current_user.id
        )
        .order_by(
            ShopOrder.created_at.desc()
        )
    ).all()

    return [
        build_order_response(
            order=order,
            db=db,
        )
        for order in orders
    ]


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
)
def get_my_order(
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
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    return build_order_response(
        order=order,
        db=db,
    )

