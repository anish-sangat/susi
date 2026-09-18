"""allow sale inventory events

Revision ID: 109c0b60164a
Revises: 8b1a8d60a459
Create Date: 2026-09-15 17:35:46.659158

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "109c0b60164a"
down_revision: Union[str, Sequence[str], None] = "8b1a8d60a459"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint(
        "ck_inventory_movement_quantity",
        "inventory_movement",
        type_="check",
    )

    op.create_check_constraint(
        "ck_inventory_movement_quantity",
        "inventory_movement",
        "quantity_change <> 0 OR reason = 'sale'",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_inventory_movement_quantity",
        "inventory_movement",
        type_="check",
    )

    op.create_check_constraint(
        "ck_inventory_movement_quantity",
        "inventory_movement",
        "quantity_change <> 0",
    )