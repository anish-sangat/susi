from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import require_admin
from app.db.database import get_db
from app.models.catalog import ProductCategory
from app.models.user import SiteUser
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
)


router = APIRouter(
    prefix="/categories",
    tags=["Categories"],
)


@router.get(
    "",
    response_model=list[CategoryResponse],
)
def get_categories(
    db: Session = Depends(get_db),
):
    categories = db.scalars(
        select(ProductCategory)
        .where(ProductCategory.is_active == True)
        .order_by(ProductCategory.name)
    ).all()

    return categories


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
)
def get_category(
    category_id: UUID,
    db: Session = Depends(get_db),
):
    category = db.scalar(
        select(ProductCategory).where(
            ProductCategory.id == category_id,
            ProductCategory.is_active == True,
        )
    )

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    return category


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: SiteUser = Depends(require_admin),
):
    if data.parent_id is not None:
        parent = db.scalar(
            select(ProductCategory).where(
                ProductCategory.id == data.parent_id,
                ProductCategory.is_active == True,
            )
        )

        if parent is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent category not found",
            )

    existing_slug = db.scalar(
        select(ProductCategory).where(
            ProductCategory.slug == data.slug
        )
    )

    if existing_slug:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category slug already exists",
        )

    category = ProductCategory(
        parent_id=data.parent_id,
        name=data.name,
        slug=data.slug,
        description=data.description,
        is_active=True,
    )

    db.add(category)
    db.commit()
    db.refresh(category)

    return category


@router.patch(
    "/{category_id}",
    response_model=CategoryResponse,
)
def update_category(
    category_id: UUID,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: SiteUser = Depends(require_admin),
):
    category = db.scalar(
        select(ProductCategory).where(
            ProductCategory.id == category_id
        )
    )

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    if "parent_id" in update_data:
        parent_id = update_data["parent_id"]

        if parent_id == category_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A category cannot be its own parent",
            )

        if parent_id is not None:
            parent = db.scalar(
                select(ProductCategory).where(
                    ProductCategory.id == parent_id,
                    ProductCategory.is_active == True,
                )
            )

            if parent is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Parent category not found",
                )

    if "slug" in update_data:
        existing_slug = db.scalar(
            select(ProductCategory).where(
                ProductCategory.slug == update_data["slug"],
                ProductCategory.id != category_id,
            )
        )

        if existing_slug:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Category slug already exists",
            )

    for field, value in update_data.items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)

    return category


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_category(
    category_id: UUID,
    db: Session = Depends(get_db),
    current_user: SiteUser = Depends(require_admin),
):
    category = db.scalar(
        select(ProductCategory).where(
            ProductCategory.id == category_id
        )
    )

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    category.is_active = False

    db.commit()

    return None