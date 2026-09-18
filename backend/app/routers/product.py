from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import require_admin
from app.db.database import get_db
from app.models.catalog import Product, ProductCategory
from app.models.user import SiteUser
from app.schemas.product import (
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)


router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


@router.get(
    "",
    response_model=list[ProductResponse],
)
def get_products(
    db: Session = Depends(get_db),
):
    products = db.scalars(
        select(Product)
        .where(Product.is_active == True)
        .order_by(Product.created_at.desc())
    ).all()

    return products


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
)
def get_product(
    product_id: UUID,
    db: Session = Depends(get_db),
):
    product = db.scalar(
        select(Product).where(
            Product.id == product_id,
            Product.is_active == True,
        )
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    return product


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: SiteUser = Depends(require_admin),
):
    category = db.scalar(
        select(ProductCategory).where(
            ProductCategory.id == data.category_id,
            ProductCategory.is_active == True,
        )
    )

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category not found",
        )

    existing_product = db.scalar(
        select(Product).where(
            Product.slug == data.slug
        )
    )

    if existing_product:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product slug already exists",
        )

    product = Product(
        category_id=data.category_id,
        name=data.name,
        slug=data.slug,
        description=data.description,
        is_active=True,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


@router.patch(
    "/{product_id}",
    response_model=ProductResponse,
)
def update_product(
    product_id: UUID,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: SiteUser = Depends(require_admin),
):
    product = db.scalar(
        select(Product).where(
            Product.id == product_id
        )
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    if "category_id" in update_data:
        category = db.scalar(
            select(ProductCategory).where(
                ProductCategory.id == update_data["category_id"],
                ProductCategory.is_active == True,
            )
        )

        if category is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category not found",
            )

    if "slug" in update_data:
        existing_product = db.scalar(
            select(Product).where(
                Product.slug == update_data["slug"],
                Product.id != product_id,
            )
        )

        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Product slug already exists",
            )

    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)

    return product


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_product(
    product_id: UUID,
    db: Session = Depends(get_db),
    current_user: SiteUser = Depends(require_admin),
):
    product = db.scalar(
        select(Product).where(
            Product.id == product_id
        )
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    product.is_active = False

    db.commit()

    return None