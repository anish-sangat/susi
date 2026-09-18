from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class InventoryMovement(Base):
    __tablename__ = "inventory_movement"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )

    product_item_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(
            "product_item.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    order_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(
            "shop_order.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    quantity_change: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    reason: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    __table_args__ = (
        CheckConstraint(
            "quantity_change <> 0 OR reason = 'sale'",
            name="ck_inventory_movement_quantity",
        ),
        CheckConstraint(
            "reason IN ('initial_stock', 'sale', 'reservation', 'release', 'adjustment', 'return')",
            name="ck_inventory_movement_reason",
        ),
    )