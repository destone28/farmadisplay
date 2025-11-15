"""Devices API endpoints."""

import secrets
import string
from datetime import datetime
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.device import Device, DeviceStatus, DeviceCommand, CommandStatus
from app.models.pharmacy import Pharmacy
from app.schemas.device import (
    DeviceCreate,
    DeviceActivate,
    DeviceStatusUpdate,
    DeviceResponse,
    DeviceHeartbeat,
    DeviceCommandCreate,
    DeviceCommandResponse,
    DeviceCommandPoll,
    DeviceCommandUpdate
)
from app.dependencies import AdminUser, CurrentUser, get_current_user, require_admin
from app.api.v1.pharmacies import require_pharmacy_access

router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("/", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def register_device(
    device_in: DeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Register a new device (ADMIN ONLY).

    Generates a unique 20-character alphanumeric activation code.
    Initial status: PENDING

    Only administrators can register new devices.
    """
    # Check serial number uniqueness
    existing = db.query(Device).filter(
        Device.serial_number == device_in.serial_number
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Serial number already registered"
        )

    # Generate secure activation code (20 chars, alphanumeric)
    activation_code = ''.join(
        secrets.choice(string.ascii_uppercase + string.digits)
        for _ in range(20)
    )

    # Create device
    device = Device(
        **device_in.dict(),
        activation_code=activation_code,
        status=DeviceStatus.PENDING
    )

    db.add(device)
    db.commit()
    db.refresh(device)

    return device


@router.post("/{device_id}/activate", response_model=DeviceResponse)
async def activate_device(
    device_id: UUID,
    activation_in: DeviceActivate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Activate a device with activation code.

    Validations:
    - Activation code must match
    - Device status must be PENDING
    - User must own target pharmacy
    - Pharmacy must be active

    Side effects:
    - Sets device status to ACTIVE
    - Associates device with pharmacy
    - Records activation timestamp
    """
    device = db.query(Device).filter(Device.id == device_id).first()

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )

    # Verify activation code
    if device.activation_code != activation_in.activation_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid activation code"
        )

    # Check device status
    if device.status != DeviceStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Device already {device.status.value}"
        )

    # Verify pharmacy ownership
    pharmacy = await require_pharmacy_access(
        activation_in.pharmacy_id,
        current_user,
        db
    )

    if not pharmacy.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pharmacy is not active"
        )

    # Activate device
    device.pharmacy_id = activation_in.pharmacy_id
    device.status = DeviceStatus.ACTIVE
    device.activated_at = datetime.utcnow()
    device.last_seen = datetime.utcnow()

    db.commit()
    db.refresh(device)

    return device


@router.get("/", response_model=List[DeviceResponse])
async def list_devices(
    pharmacy_id: UUID | None = Query(None, description="Filter by pharmacy"),
    status: DeviceStatus | None = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List devices with filters.

    RBAC:
    - Users see only devices for their own pharmacies
    - Admins see all devices

    Filters:
    - pharmacy_id: Filter by pharmacy UUID
    - status: Filter by device status
    """
    query = db.query(Device)

    # RBAC filtering
    if current_user.role != "admin":
        # Get user's pharmacy IDs
        user_pharmacy_ids = db.query(Pharmacy.id).filter(
            Pharmacy.user_id == current_user.id
        ).all()
        user_pharmacy_ids = [pid[0] for pid in user_pharmacy_ids]

        query = query.filter(Device.pharmacy_id.in_(user_pharmacy_ids))

    # Pharmacy filter
    if pharmacy_id:
        # Verify access to pharmacy
        await require_pharmacy_access(pharmacy_id, current_user, db)
        query = query.filter(Device.pharmacy_id == pharmacy_id)

    # Status filter
    if status:
        query = query.filter(Device.status == status)

    # Order by last seen (most recent first)
    query = query.order_by(Device.last_seen.desc())

    devices = query.all()
    return devices


@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(
    device_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get device details.

    RBAC:
    - Users can only see devices for their own pharmacies
    - Admins can see all devices
    """
    device = db.query(Device).filter(Device.id == device_id).first()

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )

    # Verify access if device is associated with a pharmacy
    if device.pharmacy_id:
        await require_pharmacy_access(device.pharmacy_id, current_user, db)

    return device


@router.post("/{device_id}/heartbeat", response_model=DeviceResponse)
async def device_heartbeat(
    device_id: UUID,
    heartbeat: DeviceHeartbeat,
    db: Session = Depends(get_db)
):
    """
    Device heartbeat endpoint (NO AUTH).

    Allows devices to update their status and last_seen timestamp.
    Called periodically by devices to indicate they are online.

    Updates:
    - last_seen timestamp
    - last_heartbeat timestamp
    - status based on network connection
    - firmware_version if provided
    - monitoring data (IP, CPU, memory, disk, temperature, uptime)
    """
    device = db.query(Device).filter(Device.id == device_id).first()

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )

    # Verify serial number matches
    if device.serial_number != heartbeat.serial_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Serial number mismatch"
        )

    # Update timestamps
    now = datetime.utcnow()
    device.last_seen = now
    device.last_heartbeat = now

    # Update status
    device.status = heartbeat.status

    # Update firmware version if provided
    if heartbeat.firmware_version:
        device.firmware_version = heartbeat.firmware_version

    # Update monitoring data
    if heartbeat.ip_address:
        device.ip_address = heartbeat.ip_address
    if heartbeat.uptime_seconds is not None:
        device.uptime_seconds = heartbeat.uptime_seconds
    if heartbeat.cpu_usage is not None:
        device.cpu_usage = heartbeat.cpu_usage
    if heartbeat.memory_usage is not None:
        device.memory_usage = heartbeat.memory_usage
    if heartbeat.disk_usage is not None:
        device.disk_usage = heartbeat.disk_usage
    if heartbeat.temperature is not None:
        device.temperature = heartbeat.temperature

    db.commit()
    db.refresh(device)

    return device


@router.put("/{device_id}/status", response_model=DeviceResponse)
async def update_device_status(
    device_id: UUID,
    status_update: DeviceStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Update device status (ADMIN ONLY).

    Allows administrators to manually change device status.
    Common use cases:
    - Set to MAINTENANCE for updates
    - Set to INACTIVE to disable
    """
    device = db.query(Device).filter(Device.id == device_id).first()

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )

    device.status = status_update.status
    db.commit()
    db.refresh(device)

    return device


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device(
    device_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Delete device (ADMIN ONLY).

    Permanently removes device from the system.
    """
    device = db.query(Device).filter(Device.id == device_id).first()

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )

    db.delete(device)
    db.commit()

    return None


# =============================================================================
# DEVICE REMOTE CONTROL ENDPOINTS
# =============================================================================

@router.post("/{device_id}/commands", response_model=DeviceCommandResponse, status_code=status.HTTP_201_CREATED)
async def create_device_command(
    device_id: UUID,
    command: DeviceCommandCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a command for a device.

    Supported command types:
    - reboot: Reboot the device
    - update: Update device software
    - execute: Execute a custom shell command (admin only)
    - ssh_tunnel: Establish SSH tunnel (admin only)

    RBAC:
    - Users can send reboot/update to devices for their own pharmacies
    - Admins can send any command to any device
    """
    device = db.query(Device).filter(Device.id == device_id).first()

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )

    # Verify access to device's pharmacy
    if device.pharmacy_id:
        await require_pharmacy_access(device.pharmacy_id, current_user, db)

    # Restrict dangerous commands to admin only
    dangerous_commands = ["execute", "ssh_tunnel"]
    if command.command_type in dangerous_commands and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Command type '{command.command_type}' requires admin privileges"
        )

    # Create command
    device_command = DeviceCommand(
        device_id=device_id,
        command_type=command.command_type,
        command_data=command.command_data,
        status=CommandStatus.PENDING,
        created_by=current_user.id
    )

    db.add(device_command)
    db.commit()
    db.refresh(device_command)

    return device_command


@router.get("/{device_id}/commands", response_model=List[DeviceCommandResponse])
async def list_device_commands(
    device_id: UUID,
    status_filter: CommandStatus | None = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=100, description="Max results"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List commands for a device.

    RBAC:
    - Users see commands for devices of their own pharmacies
    - Admins see all commands
    """
    device = db.query(Device).filter(Device.id == device_id).first()

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )

    # Verify access to device's pharmacy
    if device.pharmacy_id:
        await require_pharmacy_access(device.pharmacy_id, current_user, db)

    query = db.query(DeviceCommand).filter(DeviceCommand.device_id == device_id)

    if status_filter:
        query = query.filter(DeviceCommand.status == status_filter)

    commands = query.order_by(DeviceCommand.created_at.desc()).limit(limit).all()

    return commands


@router.post("/{device_id}/commands/poll", response_model=List[DeviceCommandResponse])
async def poll_device_commands(
    device_id: UUID,
    poll_data: DeviceCommandPoll,
    db: Session = Depends(get_db)
):
    """
    Poll pending commands for a device (NO AUTH).

    Called by devices to retrieve commands to execute.
    Returns pending commands and marks them as SENT.
    """
    device = db.query(Device).filter(Device.id == device_id).first()

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )

    # Verify serial number matches
    if device.serial_number != poll_data.serial_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Serial number mismatch"
        )

    # Get pending commands
    pending_commands = db.query(DeviceCommand).filter(
        DeviceCommand.device_id == device_id,
        DeviceCommand.status == CommandStatus.PENDING
    ).order_by(DeviceCommand.created_at.asc()).all()

    # Mark as sent
    now = datetime.utcnow()
    for cmd in pending_commands:
        cmd.status = CommandStatus.SENT
        cmd.sent_at = now

    db.commit()

    # Refresh to get updated data
    for cmd in pending_commands:
        db.refresh(cmd)

    return pending_commands


@router.put("/commands/{command_id}", response_model=DeviceCommandResponse)
async def update_command_status(
    command_id: UUID,
    update: DeviceCommandUpdate,
    db: Session = Depends(get_db)
):
    """
    Update command execution status (NO AUTH - called by device).

    Allows devices to report command execution progress and results.
    """
    command = db.query(DeviceCommand).filter(DeviceCommand.id == command_id).first()

    if not command:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Command not found"
        )

    # Update status
    command.status = update.status

    # Update timestamps based on status
    now = datetime.utcnow()
    if update.status == CommandStatus.EXECUTING and not command.executed_at:
        command.executed_at = now
    elif update.status in [CommandStatus.COMPLETED, CommandStatus.FAILED, CommandStatus.CANCELLED]:
        if not command.executed_at:
            command.executed_at = now
        command.completed_at = now

    # Update result/error
    if update.result:
        command.result = update.result
    if update.error:
        command.error = update.error

    db.commit()
    db.refresh(command)

    return command


@router.post("/{device_id}/reboot", response_model=DeviceCommandResponse, status_code=status.HTTP_201_CREATED)
async def reboot_device(
    device_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reboot a device (shortcut endpoint).

    Creates a reboot command for the device.
    """
    command = DeviceCommandCreate(command_type="reboot")
    return await create_device_command(device_id, command, db, current_user)
