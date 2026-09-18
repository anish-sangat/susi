from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import require_admin
from app.db.database import get_db
from app.models.catalog import (
    Product,
    ProductConfiguration,
    ProductItem,
    VariationOption,
)
from app.models.user import SiteUser
from app.schemas.product_item import (
    ProductConfigurationCreate,
    ProductConfigurationResponse,
    ProductItemCreate,
    ProductItemResponse,
    ProductItemUpdate,
    ProductVariantBatchCreate,
)


router = APIRouter(
    prefix="/product-items",
    tags=["Product Items"],
)


# ---------------------------------------------------------
# GET PRODUCT ITEMS
# ---------------------------------------------------------

@router.get(
    "",
    response_model=list[ProductItemResponse],
)
def get_product_items(
    product_id: UUID | None = None,
    db: Session = Depends(get_db),
):
    query = select(ProductItem).where(
        ProductItem.is_active == True
    )

    if product_id:
        query = query.where(
            ProductItem.product_id == product_id
        )

    items = db.scalars(
        query.order_by(ProductItem.created_at.desc())
    ).all()

    return items


# ---------------------------------------------------------
# CREATE PRODUCT ITEMS / VARIANTS IN BATCH
# ---------------------------------------------------------

@router.post(
    "/batch",
    response_model=list[ProductItemResponse],
    status_code=status.HTTP_201_CREATED,
)
def create_product_variants_batch(
    data: ProductVariantBatchCreate,
    db: Session = Depends(get_db),
    current_user: SiteUser = Depends(require_admin),
):
    # Make sure the product exists and is active.
    product = db.scalar(
        select(Product).where(
            Product.id == data.product_id,
            Product.is_active == True,
        )
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    # Prevent duplicate SKUs inside this request.
    request_skus = [
        variant.sku
        for variant in data.variants
    ]

    if len(request_skus) != len(set(request_skus)):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Duplicate SKU found in batch request",
        )

    # Make sure none of the requested SKUs already exist.
    existing_skus = db.scalars(
        select(ProductItem.sku).where(
            ProductItem.sku.in_(request_skus)
        )
    ).all()

    if existing_skus:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "One or more SKUs already exist: "
                + ", ".join(existing_skus)
            ),
        )

    # Collect all option IDs from the request.
    all_option_ids = {
        option_id
        for variant in data.variants
        for option_id in variant.option_ids
    }

    # Load all variation options in one query.
    options_by_id = {}

    if all_option_ids:
        options = db.scalars(
            select(VariationOption).where(
                VariationOption.id.in_(all_option_ids)
            )
        ).all()

        options_by_id = {
            option.id: option
            for option in options
        }

        missing_option_ids = (
            all_option_ids - set(options_by_id.keys())
        )

        if missing_option_ids:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "One or more variation options "
                    "were not found"
                ),
            )

    # Validate each variant before creating anything.
    for variant in data.variants:
        # Prevent the exact same option from appearing
        # twice inside one SKU.
        if len(variant.option_ids) != len(
            set(variant.option_ids)
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"SKU {variant.sku} contains "
                    "duplicate variation options"
                ),
            )

        # A SKU can have only one option from each
        # variation type.
        #
        # Allowed:
        # Size M + Color Black
        #
        # Not allowed:
        # Size M + Size L
        # Color Black + Color White
        variation_ids = []

        for option_id in variant.option_ids:
            option = options_by_id[option_id]
            variation_ids.append(
                option.variation_id
            )

        if len(variation_ids) != len(
            set(variation_ids)
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"SKU {variant.sku} contains more "
                    "than one option from the same variation"
                ),
            )

    created_items = []

    try:
        for variant in data.variants:
            item = ProductItem(
                product_id=data.product_id,
                sku=variant.sku,
                price=variant.price,
                qty_in_stock=variant.qty_in_stock,
                is_active=True,
            )

            db.add(item)

            # Generate the UUID/default values before
            # creating ProductConfiguration rows.
            db.flush()

            for option_id in variant.option_ids:
                configuration = ProductConfiguration(
                    product_item_id=item.id,
                    variation_option_id=option_id,
                )

                db.add(configuration)

            created_items.append(item)

        # Everything succeeds together or everything
        # rolls back together.
        db.commit()

    except Exception:
        db.rollback()
        raise

    for item in created_items:
        db.refresh(item)

    return created_items


# ---------------------------------------------------------
# GET ONE PRODUCT ITEM
# ---------------------------------------------------------

@router.get(
    "/{item_id}",
    response_model=ProductItemResponse,
)
def get_product_item(
    item_id: UUID,
    db: Session = Depends(get_db),
):
    item = db.scalar(
        select(ProductItem).where(
            ProductItem.id == item_id,
            ProductItem.is_active == True,
        )
    )

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product item not found",
        )

    return item


# ---------------------------------------------------------
# CREATE PRODUCT ITEM
# ---------------------------------------------------------

@router.post(
    "",
    response_model=ProductItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product_item(
    data: ProductItemCreate,
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

    existing_item = db.scalar(
        select(ProductItem).where(
            ProductItem.sku == data.sku
        )
    )

    if existing_item:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="SKU already exists",
        )

    item = ProductItem(
        product_id=data.product_id,
        sku=data.sku,
        price=data.price,
        qty_in_stock=data.qty_in_stock,
        is_active=True,
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


# ---------------------------------------------------------
# UPDATE PRODUCT ITEM
# ---------------------------------------------------------

@router.patch(
    "/{item_id}",
    response_model=ProductItemResponse,
)
def update_product_item(
    item_id: UUID,
    data: ProductItemUpdate,
    db: Session = Depends(get_db),
    current_user: SiteUser = Depends(require_admin),
):
    item = db.scalar(
        select(ProductItem).where(
            ProductItem.id == item_id
        )
    )

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product item not found",
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    if "sku" in update_data:
        existing_item = db.scalar(
            select(ProductItem).where(
                ProductItem.sku == update_data["sku"],
                ProductItem.id != item_id,
            )
        )

        if existing_item:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="SKU already exists",
            )

    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)

    return item


# ---------------------------------------------------------
# DELETE / DEACTIVATE PRODUCT ITEM
# ---------------------------------------------------------

@router.delete(
    "/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_product_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: SiteUser = Depends(require_admin),
):
    item = db.scalar(
        select(ProductItem).where(
            ProductItem.id == item_id
        )
    )

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product item not found",
        )

    item.is_active = False

    db.commit()

    return None


# ---------------------------------------------------------
# GET PRODUCT ITEM CONFIGURATIONS
# ---------------------------------------------------------

@router.get(
    "/{item_id}/configurations",
    response_model=list[ProductConfigurationResponse],
)
def get_configurations(
    item_id: UUID,
    db: Session = Depends(get_db),
):
    item = db.scalar(
        select(ProductItem).where(
            ProductItem.id == item_id
        )
    )

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product item not found",
        )

    configurations = db.scalars(
        select(ProductConfiguration).where(
            ProductConfiguration.product_item_id == item_id
        )
    ).all()

    return configurations


# ---------------------------------------------------------
# CREATE PRODUCT ITEM CONFIGURATION
# ---------------------------------------------------------

@router.post(
    "/configurations",
    response_model=ProductConfigurationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_configuration(
    data: ProductConfigurationCreate,
    db: Session = Depends(get_db),
    current_user: SiteUser = Depends(require_admin),
):
    # Make sure the SKU exists.
    item = db.scalar(
        select(ProductItem).where(
            ProductItem.id == data.product_item_id
        )
    )

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product item not found",
        )

    # Make sure the selected variation option exists.
    option = db.scalar(
        select(VariationOption).where(
            VariationOption.id == data.variation_option_id
        )
    )

    if option is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variation option not found",
        )

    # Prevent the exact same option from being added twice.
    existing_configuration = db.scalar(
        select(ProductConfiguration).where(
            ProductConfiguration.product_item_id
            == data.product_item_id,
            ProductConfiguration.variation_option_id
            == data.variation_option_id,
        )
    )

    if existing_configuration:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Configuration already exists",
        )

    # Prevent more than one option from the same
    # variation type on one SKU.
    existing_same_variation = db.scalar(
        select(ProductConfiguration)
        .join(
            VariationOption,
            ProductConfiguration.variation_option_id
            == VariationOption.id,
        )
        .where(
            ProductConfiguration.product_item_id
            == data.product_item_id,
            VariationOption.variation_id
            == option.variation_id,
        )
    )

    if existing_same_variation:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This product item already has an option "
                "for this variation"
            ),
        )

    configuration = ProductConfiguration(
        product_item_id=data.product_item_id,
        variation_option_id=data.variation_option_id,
    )

    db.add(configuration)
    db.commit()
    db.refresh(configuration)

    return configuration