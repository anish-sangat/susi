from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import require_admin
from app.db.database import get_db
from app.models.catalog import Product, ProductImage
from app.models.user import SiteUser
from app.schemas.product_image import (
    ProductImageCreate,
    ProductImageResponse,
    ProductImageUpdate,
)
from app.services.storage import (
    delete_product_image as delete_r2_object,
    upload_product_image,
)


router = APIRouter(
    prefix="/product-images",
    tags=["Product Images"],
)


# ---------------------------------------------------------
# GET PRODUCT IMAGES
# ---------------------------------------------------------

@router.get(
    "",
    response_model=list[ProductImageResponse],
)
def get_product_images(
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

    images = db.scalars(
        select(ProductImage)
        .where(
            ProductImage.product_id == product_id,
        )
        .order_by(
            ProductImage.sort_order,
            ProductImage.id,
        )
    ).all()

    return images


# ---------------------------------------------------------
# UPLOAD IMAGE TO CLOUDFLARE R2
# ---------------------------------------------------------

@router.post(
    "/upload",
    response_model=ProductImageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_image(
    product_id: UUID = Form(...),
    file: UploadFile = File(...),
    alt_text: str | None = Form(None),
    sort_order: int = Form(0),
    is_primary: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: SiteUser = Depends(require_admin),
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

    if is_primary:
        existing_primary = db.scalar(
            select(ProductImage).where(
                ProductImage.product_id == product_id,
                ProductImage.is_primary == True,
            )
        )

        if existing_primary:
            existing_primary.is_primary = False

    image_url, object_key = await upload_product_image(
        file=file,
        product_id=str(product_id),
    )

    image = ProductImage(
        product_id=product_id,
        image_url=image_url,
        object_key=object_key,
        alt_text=alt_text,
        sort_order=sort_order,
        is_primary=is_primary,
    )

    db.add(image)

    try:
        db.commit()
        db.refresh(image)

    except Exception:
        db.rollback()

        # Remove the uploaded R2 object if the database write fails.
        delete_r2_object(object_key)

        raise

    return image


# ---------------------------------------------------------
# CREATE IMAGE USING EXISTING URL
# ---------------------------------------------------------

@router.post(
    "",
    response_model=ProductImageResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product_image(
    data: ProductImageCreate,
    db: Session = Depends(get_db),
    current_user: SiteUser = Depends(require_admin),
):
    product = db.scalar(
        select(Product).where(
            Product.id == data.product_id,
            Product.is_active == True,
        )
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product not found",
        )

    if data.is_primary:
        existing_primary = db.scalar(
            select(ProductImage).where(
                ProductImage.product_id == data.product_id,
                ProductImage.is_primary == True,
            )
        )

        if existing_primary:
            existing_primary.is_primary = False

    image = ProductImage(
        product_id=data.product_id,
        image_url=data.image_url,
        object_key=None,
        alt_text=data.alt_text,
        sort_order=data.sort_order,
        is_primary=data.is_primary,
    )

    db.add(image)
    db.commit()
    db.refresh(image)

    return image


# ---------------------------------------------------------
# UPDATE PRODUCT IMAGE
# ---------------------------------------------------------

@router.patch(
    "/{image_id}",
    response_model=ProductImageResponse,
)
def update_product_image(
    image_id: UUID,
    data: ProductImageUpdate,
    db: Session = Depends(get_db),
    current_user: SiteUser = Depends(require_admin),
):
    image = db.scalar(
        select(ProductImage).where(
            ProductImage.id == image_id,
        )
    )

    if image is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product image not found",
        )

    update_data = data.model_dump(
        exclude_unset=True,
    )

    if update_data.get("is_primary") is True:
        existing_primary = db.scalar(
            select(ProductImage).where(
                ProductImage.product_id == image.product_id,
                ProductImage.is_primary == True,
                ProductImage.id != image_id,
            )
        )

        if existing_primary:
            existing_primary.is_primary = False

    for field, value in update_data.items():
        setattr(image, field, value)

    db.commit()
    db.refresh(image)

    return image


# ---------------------------------------------------------
# DELETE PRODUCT IMAGE
# ---------------------------------------------------------

@router.delete(
    "/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_product_image(
    image_id: UUID,
    db: Session = Depends(get_db),
    current_user: SiteUser = Depends(require_admin),
):
    image = db.scalar(
        select(ProductImage).where(
            ProductImage.id == image_id,
        )
    )

    if image is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product image not found",
        )

    # Images uploaded through our R2 upload endpoint have an object key.
    # Images created using an external URL have object_key=None.
    if image.object_key:
        delete_r2_object(image.object_key)

    db.delete(image)
    db.commit()

    return None