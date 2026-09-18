from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.database import get_db
from app.models.catalog import Product, ProductItem
from app.models.cart import ShoppingCart, ShoppingCartItem
from app.models.user import SiteUser
from app.schemas.cart import (
    CartItemCreate,
    CartItemResponse,
    CartItemUpdate,
    CartResponse,
)


router = APIRouter(
    prefix="/cart",
    tags=["Cart"],
)


def get_or_create_cart(
    user_id: UUID,
    db: Session,
) -> ShoppingCart:

    cart = db.scalar(
        select(ShoppingCart).where(
            ShoppingCart.user_id == user_id
        )
    )

    if cart is None:
        cart = ShoppingCart(
            user_id=user_id
        )

        db.add(cart)
        db.flush()

    return cart


def build_cart_response(
    cart: ShoppingCart,
    db: Session,
) -> CartResponse:

    items = db.scalars(
        select(ShoppingCartItem)
        .where(
            ShoppingCartItem.cart_id == cart.id
        )
        .order_by(ShoppingCartItem.created_at)
    ).all()

    response_items = []
    subtotal = Decimal("0")

    for item in items:

        product_item = db.scalar(
            select(ProductItem).where(
                ProductItem.id == item.product_item_id
            )
        )

        if product_item is None:
            continue

        product = db.scalar(
            select(Product).where(
                Product.id == product_item.product_id
            )
        )

        if product is None:
            continue

        line_total = (
            product_item.price * item.quantity
        )

        subtotal += line_total

        response_items.append(
            CartItemResponse(
                id=item.id,
                product_item_id=item.product_item_id,
                quantity=item.quantity,
                sku=product_item.sku,
                product_name=product.name,
                unit_price=product_item.price,
                line_total=line_total,
            )
        )

    return CartResponse(
        id=cart.id,
        user_id=cart.user_id,
        items=response_items,
        subtotal=subtotal,
    )


@router.get(
    "",
    response_model=CartResponse,
)
def get_cart(
    current_user: SiteUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cart = get_or_create_cart(
        current_user.id,
        db,
    )

    db.commit()
    db.refresh(cart)

    return build_cart_response(
        cart,
        db,
    )


@router.post(
    "/items",
    response_model=CartResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_cart_item(
    data: CartItemCreate,
    current_user: SiteUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product_item = db.scalar(
        select(ProductItem).where(
            ProductItem.id == data.product_item_id,
            ProductItem.is_active == True,
        )
    )

    if product_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product item not found",
        )

    product = db.scalar(
        select(Product).where(
            Product.id == product_item.product_id,
            Product.is_active == True,
        )
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product is not available",
        )

    cart = get_or_create_cart(
        current_user.id,
        db,
    )

    cart_item = db.scalar(
        select(ShoppingCartItem).where(
            ShoppingCartItem.cart_id == cart.id,
            ShoppingCartItem.product_item_id == data.product_item_id,
        )
    )

    if cart_item:
        new_quantity = (
            cart_item.quantity + data.quantity
        )
    else:
        new_quantity = data.quantity

    if new_quantity > product_item.qty_in_stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requested quantity exceeds available stock",
        )

    if cart_item:
        cart_item.quantity = new_quantity
    else:
        cart_item = ShoppingCartItem(
            cart_id=cart.id,
            product_item_id=data.product_item_id,
            quantity=data.quantity,
        )

        db.add(cart_item)

    db.commit()
    db.refresh(cart)

    return build_cart_response(
        cart,
        db,
    )


@router.patch(
    "/items/{item_id}",
    response_model=CartResponse,
)
def update_cart_item(
    item_id: UUID,
    data: CartItemUpdate,
    current_user: SiteUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cart = db.scalar(
        select(ShoppingCart).where(
            ShoppingCart.user_id == current_user.id
        )
    )

    if cart is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found",
        )

    cart_item = db.scalar(
        select(ShoppingCartItem).where(
            ShoppingCartItem.id == item_id,
            ShoppingCartItem.cart_id == cart.id,
        )
    )

    if cart_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found",
        )

    product_item = db.scalar(
        select(ProductItem).where(
            ProductItem.id == cart_item.product_item_id,
            ProductItem.is_active == True,
        )
    )

    if product_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product item is no longer available",
        )

    if data.quantity > product_item.qty_in_stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requested quantity exceeds available stock",
        )

    cart_item.quantity = data.quantity

    db.commit()
    db.refresh(cart)

    return build_cart_response(
        cart,
        db,
    )


@router.delete(
    "/items/{item_id}",
    response_model=CartResponse,
)
def remove_cart_item(
    item_id: UUID,
    current_user: SiteUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cart = db.scalar(
        select(ShoppingCart).where(
            ShoppingCart.user_id == current_user.id
        )
    )

    if cart is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found",
        )

    cart_item = db.scalar(
        select(ShoppingCartItem).where(
            ShoppingCartItem.id == item_id,
            ShoppingCartItem.cart_id == cart.id,
        )
    )

    if cart_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found",
        )

    db.delete(cart_item)
    db.commit()
    db.refresh(cart)

    return build_cart_response(
        cart,
        db,
    )