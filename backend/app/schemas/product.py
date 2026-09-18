from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class ProductImageResponse(BaseModel):
    id: UUID
    image_url: str
    alt_text: str | None = None
    sort_order: int
    is_primary: bool

    model_config = {
        "from_attributes": True
    }


class ProductItemResponse(BaseModel):
    id: UUID
    sku: str
    price: Decimal
    qty_in_stock: int
    is_active: bool

    model_config = {
        "from_attributes": True
    }


class ProductCreate(BaseModel):
    category_id: UUID
    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255)
    description: str | None = None


class ProductUpdate(BaseModel):
    category_id: UUID | None = None
    name: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    is_active: bool | None = None


class ProductResponse(BaseModel):
    id: UUID
    category_id: UUID
    name: str
    slug: str
    description: str | None
    is_active: bool

    model_config = {
        "from_attributes": True
    }