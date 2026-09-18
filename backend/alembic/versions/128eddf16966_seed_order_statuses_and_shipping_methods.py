"""seed order statuses and shipping methods

Revision ID: 128eddf16966
Revises: af5a85f219b6
Create Date: 2026-09-15 17:12:06.349941

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "128eddf16966"
down_revision: Union[str, Sequence[str], None] = "af5a85f219b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        INSERT INTO order_status (id, code, name, is_active)
        VALUES
            (1, 'pending', 'Pending', TRUE),
            (2, 'paid', 'Paid', TRUE),
            (3, 'processing', 'Processing', TRUE),
            (4, 'shipped', 'Shipped', TRUE),
            (5, 'delivered', 'Delivered', TRUE),
            (6, 'cancelled', 'Cancelled', TRUE)
        ON CONFLICT (id) DO NOTHING;
    """)

    op.execute("""
        INSERT INTO shipping_method
            (id, name, price, estimated_days, is_active)
        VALUES
            (1, 'Standard Shipping', 0, '3-5 business days', TRUE),
            (2, 'Express Shipping', 5000, '1-2 business days', TRUE)
        ON CONFLICT (id) DO NOTHING;
    """)


def downgrade() -> None:
    op.execute("""
        DELETE FROM shipping_method
        WHERE id IN (1, 2);
    """)

    op.execute("""
        DELETE FROM order_status
        WHERE id IN (1, 2, 3, 4, 5, 6);
    """)