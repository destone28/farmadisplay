"""increase opening_hours length

Revision ID: c4d8f9a1b2e3
Revises: bee99370f07e
Create Date: 2025-11-12 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4d8f9a1b2e3'
down_revision: Union[str, None] = 'bee99370f07e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Increase opening_hours column length from 200 to 1000
    # For SQLite, we need to recreate the column
    with op.batch_alter_table('pharmacies') as batch_op:
        batch_op.alter_column('opening_hours',
                              type_=sa.String(length=1000),
                              existing_type=sa.String(length=200),
                              nullable=True)


def downgrade() -> None:
    # Revert opening_hours column length back to 200
    with op.batch_alter_table('pharmacies') as batch_op:
        batch_op.alter_column('opening_hours',
                              type_=sa.String(length=200),
                              existing_type=sa.String(length=1000),
                              nullable=True)
