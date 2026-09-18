from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import Address, SiteUser, UserAddress
from app.schemas.address import (
    AddressCreate,
    AddressResponse,
    AddressUpdate,
)


router = APIRouter(
    prefix="/addresses",
    tags=["Addresses"],
)


def build_address_response(
    address: Address,
    user_address: UserAddress,
) -> AddressResponse:

    return AddressResponse(
        id=address.id,
        label=user_address.label,
        recipient_name=address.recipient_name,
        phone_number=address.phone_number,
        postal_code=address.postal_code,
        city=address.city,
        district=address.district,
        address_line1=address.address_line1,
        address_line2=address.address_line2,
        is_default=user_address.is_default,
    )


@router.get(
    "",
    response_model=list[AddressResponse],
)
def get_addresses(
    current_user: SiteUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.execute(
        select(Address, UserAddress)
        .join(
            UserAddress,
            UserAddress.address_id == Address.id,
        )
        .where(
            UserAddress.user_id == current_user.id
        )
        .order_by(
            UserAddress.is_default.desc(),
            UserAddress.created_at.desc(),
        )
    ).all()

    return [
        build_address_response(address, user_address)
        for address, user_address in rows
    ]


@router.post(
    "",
    response_model=AddressResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_address(
    data: AddressCreate,
    current_user: SiteUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.is_default:
        existing_defaults = db.scalars(
            select(UserAddress)
            .where(
                UserAddress.user_id == current_user.id,
                UserAddress.is_default == True,
            )
        ).all()

        for existing in existing_defaults:
            existing.is_default = False

    address = Address(
        recipient_name=data.recipient_name,
        phone_number=data.phone_number,
        postal_code=data.postal_code,
        city=data.city,
        district=data.district,
        address_line1=data.address_line1,
        address_line2=data.address_line2,
    )

    db.add(address)
    db.flush()

    user_address = UserAddress(
        user_id=current_user.id,
        address_id=address.id,
        label=data.label,
        is_default=data.is_default,
    )

    db.add(user_address)

    db.commit()
    db.refresh(address)
    db.refresh(user_address)

    return build_address_response(
        address,
        user_address,
    )


@router.patch(
    "/{address_id}",
    response_model=AddressResponse,
)
def update_address(
    address_id: UUID,
    data: AddressUpdate,
    current_user: SiteUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_address = db.scalar(
        select(UserAddress)
        .where(
            UserAddress.user_id == current_user.id,
            UserAddress.address_id == address_id,
        )
    )

    if user_address is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found",
        )

    address = db.scalar(
        select(Address)
        .where(
            Address.id == address_id
        )
    )

    if address is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found",
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    if "is_default" in update_data:
        new_default = update_data.pop("is_default")

        if new_default:
            existing_defaults = db.scalars(
                select(UserAddress)
                .where(
                    UserAddress.user_id == current_user.id,
                    UserAddress.is_default == True,
                    UserAddress.address_id != address_id,
                )
            ).all()

            for existing in existing_defaults:
                existing.is_default = False

        user_address.is_default = new_default

    if "label" in update_data:
        user_address.label = update_data.pop("label")

    for field, value in update_data.items():
        setattr(address, field, value)

    db.commit()
    db.refresh(address)
    db.refresh(user_address)

    return build_address_response(
        address,
        user_address,
    )


@router.delete(
    "/{address_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_address(
    address_id: UUID,
    current_user: SiteUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_address = db.scalar(
        select(UserAddress)
        .where(
            UserAddress.user_id == current_user.id,
            UserAddress.address_id == address_id,
        )
    )

    if user_address is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found",
        )

    address = db.scalar(
        select(Address)
        .where(
            Address.id == address_id
        )
    )

    if address is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found",
        )

    was_default = user_address.is_default

    db.delete(user_address)
    db.delete(address)

    db.flush()

    if was_default:
        next_address = db.scalar(
            select(UserAddress)
            .where(
                UserAddress.user_id == current_user.id
            )
            .order_by(
                UserAddress.created_at.desc()
            )
        )

        if next_address:
            next_address.is_default = True

    db.commit()

    return None