"""add wifi_ssid to pharmacies

Revision ID: b1c2d3e4f5g6
Revises: a1b2c3d4e5f6
Create Date: 2025-11-13 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1c2d3e4f5g6'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add wifi_ssid column to pharmacies table
    op.add_column('pharmacies', sa.Column('wifi_ssid', sa.String(length=100), nullable=True))


def downgrade() -> None:
    # Remove wifi_ssid column
    op.drop_column('pharmacies', 'wifi_ssid')
