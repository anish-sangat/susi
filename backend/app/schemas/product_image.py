from uuid import UUID

from pydantic import BaseModel, Field


class ProductImageCreate(BaseModel):
    product_id: UUID
    image_url: str = Field(min_length=1)
    alt_text: str | None = Field(default=None, max_length=255)
    sort_order: int = Field(default=0, ge=0)
    is_primary: bool = False


class ProductImageUpdate(BaseModel):
    image_url: str | None = Field(default=None, min_length=1)
    alt_text: str | None = Field(default=None, max_length=255)
    sort_order: int | None = Field(default=None, ge=0)
    is_primary: bool | None = None


class ProductImageResponse(BaseModel):
    id: UUID
    product_id: UUID
    image_url: str
    alt_text: str | None
    sort_order: int
    is_primary: bool

    model_config = {
        "from_attributes": True
    }