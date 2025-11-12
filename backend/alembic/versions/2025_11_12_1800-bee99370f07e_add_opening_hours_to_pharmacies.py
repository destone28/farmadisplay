"""add opening_hours to pharmacies

Revision ID: bee99370f07e
Revises: 92b35b1310f5
Create Date: 2025-11-12 18:00:21.934188

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2


# revision identifiers, used by Alembic.
revision: str = 'bee99370f07e'
down_revision: Union[str, None] = '92b35b1310f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add opening_hours column to pharmacies table
    op.add_column('pharmacies', sa.Column('opening_hours', sa.String(length=200), nullable=True))


def downgrade() -> None:
    # Remove opening_hours column from pharmacies table
    op.drop_column('pharmacies', 'opening_hours')
