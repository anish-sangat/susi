from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import require_admin
from app.db.database import get_db
from app.models.catalog import Product, ProductItem
from app.models.inventory import InventoryMovement
from app.models.user import SiteUser


router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
)


@router.get("/admin")
def get_admin_inventory(
    db: Session = Depends(get_db),
    current_user: SiteUser = Depends(require_admin),
):
    items = db.scalars(
        select(ProductItem)
        .where(
            ProductItem.is_active == True
        )
        .order_by(
            ProductItem.sku.asc()
        )
    ).all()

    results = []

    for item in items:
        product = db.scalar(
            select(Product)
            .where(
                Product.id == item.product_id
            )
        )

        movements = db.scalars(
            select(InventoryMovement)
            .where(
                InventoryMovement.product_item_id == item.id
            )
            .order_by(
                InventoryMovement.created_at.desc()
            )
            .limit(20)
        ).all()

        results.append(
            {
                "product_item_id": str(item.id),
                "product_id": str(item.product_id),
                "product_name": (
                    product.name
                    if product
                    else "Unknown product"
                ),
                "sku": item.sku,
                "price": item.price,
                "qty_in_stock": item.qty_in_stock,
                "is_active": item.is_active,
                "movements": [
                    {
                        "id": str(movement.id),
                        "movement_type": movement.reason,
                        "quantity_change": movement.quantity_change,
                        "order_id": (
                            str(movement.order_id)
                            if movement.order_id
                            else None
                        ),
                        "note": movement.note,
                        "created_at": movement.created_at,
                    }
                    for movement in movements
                ],
            }
        )

    return results