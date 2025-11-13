"""add display_id to pharmacies

Revision ID: a1b2c3d4e5f6
Revises: d5e6f7a8b9c0
Create Date: 2025-11-13 12:00:00.000000

"""
from typing import Sequence, Union
import string
import random

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'd5e6f7a8b9c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def generate_display_id() -> str:
    """Generate a random 6-character alphanumeric ID."""
    chars = string.ascii_lowercase + string.digits
    return ''.join(random.choice(chars) for _ in range(6))


def upgrade() -> None:
    # Add display_id column as nullable first
    op.add_column('pharmacies', sa.Column('display_id', sa.String(length=6), nullable=True))

    # Generate unique display_id for existing pharmacies
    connection = op.get_bind()
    result = connection.execute(text("SELECT id FROM pharmacies"))
    pharmacy_ids = [row[0] for row in result]

    used_ids = set()
    for pharmacy_id in pharmacy_ids:
        # Generate unique display_id
        display_id = generate_display_id()
        while display_id in used_ids:
            display_id = generate_display_id()
        used_ids.add(display_id)

        # Update pharmacy with generated display_id
        connection.execute(
            text("UPDATE pharmacies SET display_id = :display_id WHERE id = :id"),
            {"display_id": display_id, "id": str(pharmacy_id)}
        )

    # Make display_id non-nullable and add constraints
    op.alter_column('pharmacies', 'display_id', nullable=False)
    op.create_unique_constraint('uq_pharmacies_display_id', 'pharmacies', ['display_id'])
    op.create_index('ix_pharmacies_display_id', 'pharmacies', ['display_id'])


def downgrade() -> None:
    # Remove constraints and column
    op.drop_index('ix_pharmacies_display_id', table_name='pharmacies')
    op.drop_constraint('uq_pharmacies_display_id', 'pharmacies', type_='unique')
    op.drop_column('pharmacies', 'display_id')
