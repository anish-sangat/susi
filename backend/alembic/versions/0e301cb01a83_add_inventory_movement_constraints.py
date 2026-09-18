"""add inventory movement constraints

Revision ID: 0e301cb01a83
Revises: 2e29a2cefc04
Create Date: 2026-09-15 17:26:55.929491

"""

from typing import Sequence, Union

from alembic import op


revision: str = "0e301cb01a83"
down_revision: Union[str, Sequence[str], None] = "2e29a2cefc04"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        "ck_inventory_movement_quantity",
        "inventory_movement",
        "quantity_change <> 0",
    )

    op.create_check_constraint(
        "ck_inventory_movement_reason",
        "inventory_movement",
        "reason IN ('initial_stock', 'sale', 'reservation', 'release', 'adjustment', 'return')",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_inventory_movement_reason",
        "inventory_movement",
        type_="check",
    )

    op.drop_constraint(
        "ck_inventory_movement_quantity",
        "inventory_movement",
        type_="check",
    )