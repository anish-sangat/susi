
"""add payment constraints

Revision ID: 6d4c663d05da
Revises: 109c0b60164a
Create Date: 2026-09-15 17:43:32.507661

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "6d4c663d05da"
down_revision: Union[str, Sequence[str], None] = "109c0b60164a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        "ck_order_payment_amount",
        "order_payment",
        "amount >= 0",
    )

    op.create_check_constraint(
        "ck_order_payment_status",
        "order_payment",
        "status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_order_payment_status",
        "order_payment",
        type_="check",
    )

    op.drop_constraint(
        "ck_order_payment_amount",
        "order_payment",
        type_="check",
    )
