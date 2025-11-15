"""add device remote monitoring and command queue

Revision ID: f6g7h8i9j0k1
Revises: a1b2c3d4e5f6
Create Date: 2025-11-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f6g7h8i9j0k1'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add remote monitoring fields to devices and create device_commands table."""
    connection = op.get_bind()
    inspector = sa.inspect(connection)

    # 1. Add OFFLINE status to device_status enum if not exists
    print("Updating device_status enum...")
    op.execute("ALTER TYPE device_status ADD VALUE IF NOT EXISTS 'offline'")

    # 2. Add remote monitoring columns to devices table
    print("Adding remote monitoring columns to devices table...")
    devices_columns = [col['name'] for col in inspector.get_columns('devices')]

    if 'ip_address' not in devices_columns:
        op.add_column('devices', sa.Column('ip_address', sa.String(length=45), nullable=True))
    if 'uptime_seconds' not in devices_columns:
        op.add_column('devices', sa.Column('uptime_seconds', sa.Integer(), nullable=True))
    if 'cpu_usage' not in devices_columns:
        op.add_column('devices', sa.Column('cpu_usage', sa.Float(), nullable=True))
    if 'memory_usage' not in devices_columns:
        op.add_column('devices', sa.Column('memory_usage', sa.Float(), nullable=True))
    if 'disk_usage' not in devices_columns:
        op.add_column('devices', sa.Column('disk_usage', sa.Float(), nullable=True))
    if 'temperature' not in devices_columns:
        op.add_column('devices', sa.Column('temperature', sa.Float(), nullable=True))
    if 'last_heartbeat' not in devices_columns:
        op.add_column('devices', sa.Column('last_heartbeat', sa.DateTime(timezone=True), nullable=True))

    # 3. Create command_status enum type
    print("Creating command_status enum type...")
    command_status_enum = postgresql.ENUM(
        'pending', 'sent', 'executing', 'completed', 'failed', 'cancelled',
        name='command_status',
        create_type=False
    )

    # Check if enum type exists
    result = connection.execute(sa.text(
        "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'command_status')"
    ))
    enum_exists = result.scalar()

    if not enum_exists:
        command_status_enum.create(connection, checkfirst=True)

    # 4. Create device_commands table
    print("Creating device_commands table...")
    tables = inspector.get_table_names()

    if 'device_commands' not in tables:
        op.create_table(
            'device_commands',
            sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('device_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('command_type', sa.String(length=50), nullable=False),
            sa.Column('command_data', sa.Text(), nullable=True),
            sa.Column('status', postgresql.ENUM(
                'pending', 'sent', 'executing', 'completed', 'failed', 'cancelled',
                name='command_status',
                create_type=False
            ), nullable=False),
            sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('executed_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('result', sa.Text(), nullable=True),
            sa.Column('error', sa.Text(), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['device_id'], ['devices.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['created_by'], ['users.id'], )
        )
        op.create_index('ix_device_commands_device_id', 'device_commands', ['device_id'])

    print("Migration completed successfully!")


def downgrade() -> None:
    """Remove remote monitoring features."""
    print("Removing device_commands table...")
    op.drop_index('ix_device_commands_device_id', table_name='device_commands')
    op.drop_table('device_commands')

    print("Dropping command_status enum...")
    op.execute("DROP TYPE IF EXISTS command_status")

    print("Removing remote monitoring columns from devices...")
    op.drop_column('devices', 'last_heartbeat')
    op.drop_column('devices', 'temperature')
    op.drop_column('devices', 'disk_usage')
    op.drop_column('devices', 'memory_usage')
    op.drop_column('devices', 'cpu_usage')
    op.drop_column('devices', 'uptime_seconds')
    op.drop_column('devices', 'ip_address')

    # Note: Cannot remove OFFLINE from enum without recreating it
    # This is a PostgreSQL limitation
    print("Note: Cannot remove OFFLINE status from device_status enum")
    print("Downgrade completed!")
