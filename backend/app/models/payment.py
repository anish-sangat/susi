
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PaymentType(Base):
    __tablename__ = "payment_type"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="true"
    )


class UserPaymentMethod(Base):
    __tablename__ = "user_payment_method"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid()
    )

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(
            "site_user.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    payment_type_id: Mapped[int] = mapped_column(
        ForeignKey("payment_type.id"),
        nullable=False
    )

    provider_customer_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    provider_payment_method_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    display_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    is_default: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="false"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "provider_payment_method_id",
            name="uq_user_provider_payment_method"
        ),
    )


class OrderPayment(Base):
    __tablename__ = "order_payment"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid()
    )

    order_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(
            "shop_order.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    payment_type_id: Mapped[int] = mapped_column(
        ForeignKey("payment_type.id"),
        nullable=False
    )

    provider: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    provider_payment_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )

    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        server_default="KRW"
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint(
            "provider",
            "provider_payment_id",
            name="uq_order_payment_provider_id"
        ),
        CheckConstraint(
            "amount >= 0",
            name="ck_order_payment_amount"
        ),
        CheckConstraint(
            "status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')",
            name="ck_order_payment_status"
        ),
    )


class PaymentEvent(Base):
    __tablename__ = "payment_event"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid()
    )

    provider: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    provider_event_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True
    )

    event_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    payload: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False
    )

    processed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )
