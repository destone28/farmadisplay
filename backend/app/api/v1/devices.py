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
from app.models.device import Device, DeviceStatus
from app.models.pharmacy import Pharmacy
from app.schemas.device import (
    DeviceCreate,
    DeviceActivate,
    DeviceStatusUpdate,
    DeviceResponse,
    DeviceHeartbeat
)
from app.dependencies import AdminUser, CurrentUser, get_current_user
from app.api.v1.pharmacies import require_pharmacy_access

router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("/", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def register_device(
    device_in: DeviceCreate,
    current_user: AdminUser = None,
    db: Session = Depends(get_db)
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
    current_user: CurrentUser = None,
    db: Session = Depends(get_db)
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
    current_user: CurrentUser = None,
    db: Session = Depends(get_db)
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
    current_user: CurrentUser = None,
    db: Session = Depends(get_db)
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
    - status based on network connection
    - firmware_version if provided
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

    # Update last seen
    device.last_seen = datetime.utcnow()

    # Update status
    device.status = heartbeat.status

    # Update firmware version if provided
    if heartbeat.firmware_version:
        device.firmware_version = heartbeat.firmware_version

    db.commit()
    db.refresh(device)

    return device


@router.put("/{device_id}/status", response_model=DeviceResponse)
async def update_device_status(
    device_id: UUID,
    status_update: DeviceStatusUpdate,
    current_user: AdminUser = None,
    db: Session = Depends(get_db)
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
    current_user: AdminUser = None,
    db: Session = Depends(get_db)
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
