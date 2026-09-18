from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class OrderAddressCreate(BaseModel):
    recipient_name: str = Field(
        min_length=1,
        max_length=150,
    )

    phone_number: str = Field(
        min_length=1,
        max_length=30,
    )

    postal_code: str = Field(
        min_length=1,
        max_length=20,
    )

    city: str = Field(
        min_length=1,
        max_length=100,
    )

    district: str = Field(
        min_length=1,
        max_length=100,
    )

    address_line1: str = Field(
        min_length=1,
        max_length=255,
    )

    address_line2: str | None = Field(
        default=None,
        max_length=255,
    )


class OrderCreate(BaseModel):
    shipping_method_id: int
    shipping_address: OrderAddressCreate
    billing_address: OrderAddressCreate | None = None
    notes: str | None = None


class OrderLineResponse(BaseModel):
    id: UUID
    product_item_id: UUID
    product_name: str
    sku: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal

    model_config = {
        "from_attributes": True
    }


class OrderAddressResponse(BaseModel):
    id: UUID
    address_type: str
    recipient_name: str
    phone_number: str
    postal_code: str
    city: str
    district: str
    address_line1: str
    address_line2: str | None

    model_config = {
        "from_attributes": True
    }


class OrderResponse(BaseModel):
    id: UUID
    order_number: UUID
    user_id: UUID
    status_id: int
    shipping_method_id: int
    customer_email: str
    currency: str
    subtotal: Decimal
    discount_amount: Decimal
    shipping_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    notes: str | None
    reservation_expires_at: datetime | None
    lines: list[OrderLineResponse]
    addresses: list[OrderAddressResponse]

    model_config = {
        "from_attributes": True
    }