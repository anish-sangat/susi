from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.order import ShopOrder
from app.models.order_line import OrderLine
from app.models.order_status_history import OrderStatusHistory
from app.services.inventory import release_stock


PENDING_STATUS_ID = 1
FAILED_STATUS_ID = 6


def expire_pending_orders(
    db: Session,
) -> int:
    now = datetime.now(timezone.utc)

    expired_orders = db.scalars(
        select(ShopOrder)
        .where(
            ShopOrder.status_id == PENDING_STATUS_ID,
            ShopOrder.reservation_expires_at.is_not(None),
            ShopOrder.reservation_expires_at <= now,
        )
        .with_for_update(skip_locked=True)
    ).all()

    expired_count = 0

    for order in expired_orders:
        order_lines = db.scalars(
            select(OrderLine)
            .where(OrderLine.order_id == order.id)
        ).all()

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
                note="Payment reservation expired",
            )
        )

        expired_count += 1

    db.commit()

    return expired_count