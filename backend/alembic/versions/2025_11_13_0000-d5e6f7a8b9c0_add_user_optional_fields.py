"""add user optional fields

Revision ID: d5e6f7a8b9c0
Revises: c4d8f9a1b2e3
Create Date: 2025-11-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd5e6f7a8b9c0'
down_revision: Union[str, None] = 'c4d8f9a1b2e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add optional fields to users table
    op.add_column('users', sa.Column('phone', sa.String(length=20), nullable=True))
    op.add_column('users', sa.Column('city', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('postal_code', sa.String(length=10), nullable=True))
    op.add_column('users', sa.Column('address', sa.String(length=500), nullable=True))


def downgrade() -> None:
    # Remove optional fields from users table
    op.drop_column('users', 'address')
    op.drop_column('users', 'postal_code')
    op.drop_column('users', 'city')
    op.drop_column('users', 'phone')
