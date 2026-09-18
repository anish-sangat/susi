from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.catalog import ProductItem
from app.models.inventory import InventoryMovement


def reserve_stock(
    db: Session,
    product_item_id: UUID,
    quantity: int,
    order_id: UUID,
) -> None:

    if quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than zero",
        )

    product_item = db.scalar(
        select(ProductItem)
        .where(
            ProductItem.id == product_item_id,
            ProductItem.is_active == True,
        )
        .with_for_update()
    )

    if product_item is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product item not found",
        )

    if product_item.qty_in_stock < quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock for SKU {product_item.sku}",
        )

    product_item.qty_in_stock -= quantity

    movement = InventoryMovement(
        product_item_id=product_item.id,
        order_id=order_id,
        quantity_change=-quantity,
        reason="reservation",
        note=f"Stock reserved for order {order_id}",
    )

    db.add(movement)


def release_stock(
    db: Session,
    product_item_id: UUID,
    quantity: int,
    order_id: UUID,
) -> None:

    if quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than zero",
        )

    product_item = db.scalar(
        select(ProductItem)
        .where(
            ProductItem.id == product_item_id
        )
        .with_for_update()
    )

    if product_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product item not found",
        )

    product_item.qty_in_stock += quantity

    movement = InventoryMovement(
        product_item_id=product_item.id,
        order_id=order_id,
        quantity_change=quantity,
        reason="release",
        note=f"Stock released for order {order_id}",
    )

    db.add(movement)


def complete_sale(
    db: Session,
    product_item_id: UUID,
    quantity: int,
    order_id: UUID,
) -> None:

    if quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than zero",
        )

    movement = InventoryMovement(
        product_item_id=product_item_id,
        order_id=order_id,
        quantity_change=0,
        reason="sale",
        note=f"Reserved stock converted to sale for order {order_id}",
    )

    db.add(movement)