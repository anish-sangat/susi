from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class CartItemCreate(BaseModel):
    product_item_id: UUID
    quantity: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1)


class CartItemResponse(BaseModel):
    id: UUID
    product_item_id: UUID
    quantity: int
    sku: str
    product_name: str
    unit_price: Decimal
    line_total: Decimal

    model_config = {
        "from_attributes": True
    }


class CartResponse(BaseModel):
    id: UUID
    user_id: UUID
    items: list[CartItemResponse]
    subtotal: Decimal