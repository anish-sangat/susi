from uuid import UUID

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    parent_id: UUID | None = None
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=120)
    description: str | None = None


class CategoryUpdate(BaseModel):
    parent_id: UUID | None = None
    name: str | None = Field(default=None, min_length=1, max_length=100)
    slug: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    is_active: bool | None = None


class CategoryResponse(BaseModel):
    id: UUID
    parent_id: UUID | None
    name: str
    slug: str
    description: str | None
    is_active: bool

    model_config = {
        "from_attributes": True
    }