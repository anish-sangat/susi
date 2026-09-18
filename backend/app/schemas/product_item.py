from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class ProductItemCreate(BaseModel):
    product_id: UUID
    sku: str = Field(min_length=1, max_length=100)
    price: Decimal = Field(ge=0)
    qty_in_stock: int = Field(default=0, ge=0)


class ProductItemUpdate(BaseModel):
    sku: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    price: Decimal | None = Field(
        default=None,
        ge=0,
    )
    qty_in_stock: int | None = Field(
        default=None,
        ge=0,
    )
    is_active: bool | None = None


class ProductItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    sku: str
    price: Decimal
    qty_in_stock: int
    is_active: bool

    model_config = {
        "from_attributes": True
    }


class ProductConfigurationCreate(BaseModel):
    product_item_id: UUID
    variation_option_id: UUID


class ProductConfigurationResponse(BaseModel):
    id: UUID
    product_item_id: UUID
    variation_option_id: UUID

    model_config = {
        "from_attributes": True
    }


class ProductVariantBatchItem(BaseModel):
    sku: str = Field(
        min_length=1,
        max_length=100,
    )
    price: Decimal = Field(ge=0)
    qty_in_stock: int = Field(
        default=0,
        ge=0,
    )
    option_ids: list[UUID] = Field(
        default_factory=list,
    )


class ProductVariantBatchCreate(BaseModel):
    product_id: UUID
    variants: list[ProductVariantBatchItem] = Field(
        min_length=1,
        max_length=100,
    )