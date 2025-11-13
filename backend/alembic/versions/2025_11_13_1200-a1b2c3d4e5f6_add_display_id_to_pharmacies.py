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
    connection = op.get_bind()

    # Check if column already exists
    inspector = sa.inspect(connection)
    columns = [col['name'] for col in inspector.get_columns('pharmacies')]

    column_exists = 'display_id' in columns

    # Add display_id column if it doesn't exist
    if not column_exists:
        print("Adding display_id column...")
        op.add_column('pharmacies', sa.Column('display_id', sa.String(length=6), nullable=True))
    else:
        print("Column display_id already exists, skipping column creation...")

    # Generate unique display_id for existing pharmacies that don't have one
    result = connection.execute(text("SELECT id, display_id FROM pharmacies"))
    pharmacies = [(row[0], row[1]) for row in result]

    # Find pharmacies without display_id
    pharmacies_without_id = [p for p in pharmacies if not p[1]]

    if pharmacies_without_id:
        print(f"Generating display_ids for {len(pharmacies_without_id)} pharmacies...")

        # Get existing display_ids to avoid duplicates
        existing_ids = set([p[1] for p in pharmacies if p[1]])

        for pharmacy_id, _ in pharmacies_without_id:
            # Generate unique display_id
            display_id = generate_display_id()
            while display_id in existing_ids:
                display_id = generate_display_id()
            existing_ids.add(display_id)

            # Update pharmacy with generated display_id
            connection.execute(
                text("UPDATE pharmacies SET display_id = :display_id WHERE id = :id"),
                {"display_id": display_id, "id": str(pharmacy_id)}
            )
            print(f"  Generated {display_id} for pharmacy {pharmacy_id}")
    else:
        print("All pharmacies already have display_ids")

    # Make display_id non-nullable and add constraints if not already done
    if not column_exists:
        print("Adding constraints...")
        op.alter_column('pharmacies', 'display_id', nullable=False)
        op.create_unique_constraint('uq_pharmacies_display_id', 'pharmacies', ['display_id'])
        op.create_index('ix_pharmacies_display_id', 'pharmacies', ['display_id'])
    else:
        # Check if constraints exist
        try:
            # Try to create constraints if they don't exist
            op.alter_column('pharmacies', 'display_id', nullable=False)
        except:
            print("Column already non-nullable")

        try:
            op.create_unique_constraint('uq_pharmacies_display_id', 'pharmacies', ['display_id'])
        except:
            print("Unique constraint already exists")

        try:
            op.create_index('ix_pharmacies_display_id', 'pharmacies', ['display_id'], unique=False)
        except:
            print("Index already exists")

    print("Migration completed successfully!")


def downgrade() -> None:
    # Remove constraints and column
    op.drop_index('ix_pharmacies_display_id', table_name='pharmacies')
    op.drop_constraint('uq_pharmacies_display_id', 'pharmacies', type_='unique')
    op.drop_column('pharmacies', 'display_id')
