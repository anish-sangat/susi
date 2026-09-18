from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.catalog import (
    Product,
    ProductConfiguration,
    ProductImage,
    ProductItem,
    Variation,
    VariationOption,
)
from app.models.order_status import ShippingMethod
from app.schemas.storefront import (
    StorefrontProductDetailResponse,
    StorefrontProductImageResponse,
    StorefrontProductResponse,
    StorefrontShippingMethodResponse,
    StorefrontVariantOptionResponse,
    StorefrontVariantResponse,
)


router = APIRouter(
    prefix="/storefront",
    tags=["Storefront"],
)


# ---------------------------------------------------------
# GET STOREFRONT PRODUCTS
# ---------------------------------------------------------

@router.get(
    "/products",
    response_model=list[StorefrontProductResponse],
)
def get_storefront_products(
    db: Session = Depends(get_db),
):
    products = db.scalars(
        select(Product)
        .where(Product.is_active == True)
        .order_by(Product.created_at.desc())
    ).all()

    results: list[StorefrontProductResponse] = []

    for product in products:
        item_data = db.execute(
            select(
                func.min(ProductItem.price),
                func.coalesce(
                    func.sum(ProductItem.qty_in_stock),
                    0,
                ),
            ).where(
                ProductItem.product_id == product.id,
                ProductItem.is_active == True,
            )
        ).one()

        price = item_data[0]
        qty_in_stock = int(item_data[1])

        primary_image = db.scalar(
            select(ProductImage)
            .where(
                ProductImage.product_id == product.id,
                ProductImage.is_primary == True,
            )
            .order_by(
                ProductImage.sort_order,
                ProductImage.id,
            )
            .limit(1)
        )

        if primary_image is None:
            primary_image = db.scalar(
                select(ProductImage)
                .where(
                    ProductImage.product_id == product.id
                )
                .order_by(
                    ProductImage.sort_order,
                    ProductImage.id,
                )
                .limit(1)
            )

        results.append(
            StorefrontProductResponse(
                id=product.id,
                category_id=product.category_id,
                name=product.name,
                slug=product.slug,
                description=product.description,
                price=price,
                qty_in_stock=qty_in_stock,
                is_available=qty_in_stock > 0,
                primary_image_url=(
                    primary_image.image_url
                    if primary_image
                    else None
                ),
                primary_image_alt=(
                    primary_image.alt_text
                    if primary_image
                    else None
                ),
            )
        )

    return results


# ---------------------------------------------------------
# GET STOREFRONT SHIPPING METHODS
# ---------------------------------------------------------

@router.get(
    "/shipping-methods",
    response_model=list[StorefrontShippingMethodResponse],
)
def get_storefront_shipping_methods(
    db: Session = Depends(get_db),
):
    shipping_methods = db.scalars(
        select(ShippingMethod)
        .where(
            ShippingMethod.is_active == True
        )
        .order_by(
            ShippingMethod.price,
            ShippingMethod.id,
        )
    ).all()

    return shipping_methods


# ---------------------------------------------------------
# GET STOREFRONT PRODUCT DETAIL
# ---------------------------------------------------------

@router.get(
    "/products/{slug}",
    response_model=StorefrontProductDetailResponse,
)
def get_storefront_product(
    slug: str,
    db: Session = Depends(get_db),
):
    # Find the active product.
    product = db.scalar(
        select(Product).where(
            Product.slug == slug,
            Product.is_active == True,
        )
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    # -----------------------------------------------------
    # IMAGES
    # -----------------------------------------------------

    product_images = db.scalars(
        select(ProductImage)
        .where(
            ProductImage.product_id == product.id
        )
        .order_by(
            ProductImage.sort_order,
            ProductImage.id,
        )
    ).all()

    images = [
        StorefrontProductImageResponse(
            id=image.id,
            image_url=image.image_url,
            alt_text=image.alt_text,
            sort_order=image.sort_order,
            is_primary=image.is_primary,
        )
        for image in product_images
    ]

    # -----------------------------------------------------
    # ACTIVE PRODUCT ITEMS / SKUS
    # -----------------------------------------------------

    product_items = db.scalars(
        select(ProductItem)
        .where(
            ProductItem.product_id == product.id,
            ProductItem.is_active == True,
        )
        .order_by(ProductItem.sku)
    ).all()

    variants: list[StorefrontVariantResponse] = []

    total_stock = 0

    for item in product_items:
        total_stock += item.qty_in_stock

        # Get the variation options attached to this SKU.
        option_rows = db.execute(
            select(
                Variation.id,
                Variation.name,
                VariationOption.id,
                VariationOption.value,
                VariationOption.sort_order,
            )
            .join(
                VariationOption,
                VariationOption.variation_id
                == Variation.id,
            )
            .join(
                ProductConfiguration,
                ProductConfiguration.variation_option_id
                == VariationOption.id,
            )
            .where(
                ProductConfiguration.product_item_id
                == item.id
            )
            .order_by(
                Variation.name,
                VariationOption.sort_order,
            )
        ).all()

        options = [
            StorefrontVariantOptionResponse(
                variation_id=row[0],
                variation_name=row[1],
                option_id=row[2],
                option_value=row[3],
                sort_order=row[4],
            )
            for row in option_rows
        ]

        variants.append(
            StorefrontVariantResponse(
                id=item.id,
                sku=item.sku,
                price=item.price,
                qty_in_stock=item.qty_in_stock,
                is_available=item.qty_in_stock > 0,
                options=options,
            )
        )

    # -----------------------------------------------------
    # PRODUCT DISPLAY PRICE
    # -----------------------------------------------------

    price = None

    if product_items:
        price = min(
            item.price
            for item in product_items
        )

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return StorefrontProductDetailResponse(
        id=product.id,
        category_id=product.category_id,
        name=product.name,
        slug=product.slug,
        description=product.description,
        price=price,
        qty_in_stock=total_stock,
        is_available=total_stock > 0,
        images=images,
        variants=variants,
    )