"""Device schemas for request/response validation."""
from __future__ import annotations


from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.device import DeviceStatus


class DeviceBase(BaseModel):
    """Base device schema."""

    serial_number: str = Field(..., min_length=1, max_length=100)
    mac_address: Optional[str] = Field(None, max_length=17)
    firmware_version: Optional[str] = Field(None, max_length=20)


class DeviceCreate(DeviceBase):
    """Schema for creating a new device."""

    activation_code: str = Field(..., min_length=6, max_length=20)


class DeviceActivate(BaseModel):
    """Schema for activating a device."""

    activation_code: str = Field(..., min_length=6, max_length=20)
    pharmacy_id: UUID


class DeviceStatusUpdate(BaseModel):
    """Schema for updating device status."""

    status: DeviceStatus


class DeviceResponse(DeviceBase):
    """Schema for device response."""

    id: UUID
    activation_code: str
    pharmacy_id: Optional[UUID]
    status: DeviceStatus
    last_seen: Optional[datetime]
    created_at: datetime
    activated_at: Optional[datetime]

    class Config:
        """Pydantic config."""
        from_attributes = True


class DeviceHeartbeat(BaseModel):
    """Schema for device heartbeat."""

    serial_number: str
    firmware_version: Optional[str] = None
    status: DeviceStatus = DeviceStatus.ACTIVE
