"""add logo_path column to pharmacies

Revision ID: 92b35b1310f5
Revises: 
Create Date: 2025-11-12 17:21:13.861872

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2


# revision identifiers, used by Alembic.
revision: str = '92b35b1310f5'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Only add logo_path column to pharmacies table
    op.add_column('pharmacies', sa.Column('logo_path', sa.String(length=500), nullable=True))


def downgrade() -> None:
    # Remove logo_path column from pharmacies table
    op.drop_column('pharmacies', 'logo_path')
