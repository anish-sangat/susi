from uuid import UUID

from pydantic import BaseModel, Field


class VariationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)


class VariationResponse(BaseModel):
    id: UUID
    name: str

    model_config = {
        "from_attributes": True
    }


class VariationOptionCreate(BaseModel):
    variation_id: UUID
    value: str = Field(min_length=1, max_length=100)
    sort_order: int = 0


class VariationOptionResponse(BaseModel):
    id: UUID
    variation_id: UUID
    value: str
    sort_order: int

    model_config = {
        "from_attributes": True
    }