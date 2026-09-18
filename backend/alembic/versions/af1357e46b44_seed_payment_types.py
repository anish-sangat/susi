from alembic import op
import sqlalchemy as sa


revision = "af1357e46b44"
down_revision = "6d4c663d05da"
branch_labels = None
depends_on = None


def upgrade() -> None:
    payment_type = sa.table(
        "payment_type",
        sa.column("id", sa.Integer),
        sa.column("code", sa.String),
        sa.column("name", sa.String),
        sa.column("is_active", sa.Boolean),
    )

    op.bulk_insert(
        payment_type,
        [
            {
                "id": 1,
                "code": "card",
                "name": "Card",
                "is_active": True,
            },
            {
                "id": 2,
                "code": "bank_transfer",
                "name": "Bank Transfer",
                "is_active": True,
            },
        ],
    )


def downgrade() -> None:
    op.execute(
        "DELETE FROM payment_type "
        "WHERE code IN ('card', 'bank_transfer')"
    )