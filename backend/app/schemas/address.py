from uuid import UUID

from pydantic import BaseModel, Field


class AddressCreate(BaseModel):
    label: str | None = Field(
        default=None,
        max_length=50
    )
    recipient_name: str = Field(
        min_length=1,
        max_length=150
    )
    phone_number: str = Field(
        min_length=1,
        max_length=30
    )
    postal_code: str = Field(
        min_length=1,
        max_length=20
    )
    city: str = Field(
        min_length=1,
        max_length=100
    )
    district: str = Field(
        min_length=1,
        max_length=100
    )
    address_line1: str = Field(
        min_length=1,
        max_length=255
    )
    address_line2: str | None = Field(
        default=None,
        max_length=255
    )
    is_default: bool = False


class AddressUpdate(BaseModel):
    label: str | None = Field(
        default=None,
        max_length=50
    )
    recipient_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150
    )
    phone_number: str | None = Field(
        default=None,
        min_length=1,
        max_length=30
    )
    postal_code: str | None = Field(
        default=None,
        min_length=1,
        max_length=20
    )
    city: str | None = Field(
        default=None,
        min_length=1,
        max_length=100
    )
    district: str | None = Field(
        default=None,
        min_length=1,
        max_length=100
    )
    address_line1: str | None = Field(
        default=None,
        min_length=1,
        max_length=255
    )
    address_line2: str | None = Field(
        default=None,
        max_length=255
    )
    is_default: bool | None = None


class AddressResponse(BaseModel):
    id: UUID
    label: str | None
    recipient_name: str
    phone_number: str
    postal_code: str
    city: str
    district: str
    address_line1: str
    address_line2: str | None
    is_default: bool

    model_config = {
        "from_attributes": True
    }