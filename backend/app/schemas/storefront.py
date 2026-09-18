from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


# ---------------------------------------------------------
# PRODUCT LIST / HOMEPAGE
# ---------------------------------------------------------

class StorefrontProductResponse(BaseModel):
    id: UUID
    category_id: UUID
    name: str
    slug: str
    description: str | None

    price: Decimal | None
    qty_in_stock: int
    is_available: bool

    primary_image_url: str | None
    primary_image_alt: str | None


# ---------------------------------------------------------
# PRODUCT DETAIL - IMAGE
# ---------------------------------------------------------

class StorefrontProductImageResponse(BaseModel):
    id: UUID
    image_url: str
    alt_text: str | None
    sort_order: int
    is_primary: bool


# ---------------------------------------------------------
# PRODUCT DETAIL - VARIANT OPTION
# ---------------------------------------------------------

class StorefrontVariantOptionResponse(BaseModel):
    variation_id: UUID
    variation_name: str

    option_id: UUID
    option_value: str
    sort_order: int


# ---------------------------------------------------------
# PRODUCT DETAIL - SKU / VARIANT
# ---------------------------------------------------------

class StorefrontVariantResponse(BaseModel):
    id: UUID
    sku: str
    price: Decimal
    qty_in_stock: int
    is_available: bool

    options: list[StorefrontVariantOptionResponse]


# ---------------------------------------------------------
# PRODUCT DETAIL
# ---------------------------------------------------------

class StorefrontProductDetailResponse(BaseModel):
    id: UUID
    category_id: UUID

    name: str
    slug: str
    description: str | None

    price: Decimal | None
    qty_in_stock: int
    is_available: bool

    images: list[StorefrontProductImageResponse]
    variants: list[StorefrontVariantResponse]


# ---------------------------------------------------------
# SHIPPING METHOD
# ---------------------------------------------------------

class StorefrontShippingMethodResponse(BaseModel):
    id: int
    name: str
    price: int
    estimated_days: str | None

    model_config = {
        "from_attributes": True
    }