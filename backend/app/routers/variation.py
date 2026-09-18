from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import require_admin
from app.db.database import get_db
from app.models.catalog import Variation, VariationOption
from app.models.user import SiteUser
from app.schemas.variation import (
    VariationCreate,
    VariationOptionCreate,
    VariationOptionResponse,
    VariationResponse,
)


router = APIRouter(
    prefix="/variations",
    tags=["Variations"],
)


@router.get(
    "",
    response_model=list[VariationResponse],
)
def get_variations(
    db: Session = Depends(get_db),
):
    variations = db.scalars(
        select(Variation)
        .order_by(Variation.name)
    ).all()

    return variations


@router.post(
    "",
    response_model=VariationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_variation(
    data: VariationCreate,
    db: Session = Depends(get_db),
    current_user: SiteUser = Depends(require_admin),
):
    existing_variation = db.scalar(
        select(Variation).where(
            Variation.name == data.name
        )
    )

    if existing_variation:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Variation already exists",
        )

    variation = Variation(
        name=data.name
    )

    db.add(variation)
    db.commit()
    db.refresh(variation)

    return variation


@router.get(
    "/{variation_id}/options",
    response_model=list[VariationOptionResponse],
)
def get_variation_options(
    variation_id: UUID,
    db: Session = Depends(get_db),
):
    variation = db.scalar(
        select(Variation).where(
            Variation.id == variation_id
        )
    )

    if variation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variation not found",
        )

    options = db.scalars(
        select(VariationOption)
        .where(
            VariationOption.variation_id == variation_id
        )
        .order_by(VariationOption.sort_order)
    ).all()

    return options


@router.post(
    "/options",
    response_model=VariationOptionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_variation_option(
    data: VariationOptionCreate,
    db: Session = Depends(get_db),
    current_user: SiteUser = Depends(require_admin),
):
    variation = db.scalar(
        select(Variation).where(
            Variation.id == data.variation_id
        )
    )

    if variation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variation not found",
        )

    existing_option = db.scalar(
        select(VariationOption).where(
            VariationOption.variation_id == data.variation_id,
            VariationOption.value == data.value,
        )
    )

    if existing_option:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Variation option already exists",
        )

    option = VariationOption(
        variation_id=data.variation_id,
        value=data.value,
        sort_order=data.sort_order,
    )

    db.add(option)
    db.commit()
    db.refresh(option)

    return option