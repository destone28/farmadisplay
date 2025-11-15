"""Device schemas for request/response validation."""
from __future__ import annotations


from datetime import datetime
from typing import Optional, Any
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.device import DeviceStatus, CommandStatus


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

    # Remote monitoring fields
    ip_address: Optional[str] = None
    uptime_seconds: Optional[int] = None
    cpu_usage: Optional[float] = None
    memory_usage: Optional[float] = None
    disk_usage: Optional[float] = None
    temperature: Optional[float] = None
    last_heartbeat: Optional[datetime] = None
    is_online: bool = False

    class Config:
        """Pydantic config."""
        from_attributes = True


class DeviceHeartbeat(BaseModel):
    """Schema for device heartbeat."""

    serial_number: str
    firmware_version: Optional[str] = None
    status: DeviceStatus = DeviceStatus.ACTIVE

    # Monitoring data
    ip_address: Optional[str] = None
    uptime_seconds: Optional[int] = None
    cpu_usage: Optional[float] = Field(None, ge=0, le=100)
    memory_usage: Optional[float] = Field(None, ge=0, le=100)
    disk_usage: Optional[float] = Field(None, ge=0, le=100)
    temperature: Optional[float] = None


class DeviceCommandCreate(BaseModel):
    """Schema for creating a device command."""

    command_type: str = Field(..., min_length=1, max_length=50)
    command_data: Optional[str] = None  # JSON string


class DeviceCommandResponse(BaseModel):
    """Schema for device command response."""

    id: UUID
    device_id: UUID
    command_type: str
    command_data: Optional[str]
    status: CommandStatus
    created_by: Optional[UUID]
    created_at: datetime
    sent_at: Optional[datetime]
    executed_at: Optional[datetime]
    completed_at: Optional[datetime]
    result: Optional[str]
    error: Optional[str]

    class Config:
        """Pydantic config."""
        from_attributes = True


class DeviceCommandPoll(BaseModel):
    """Schema for polling pending commands."""

    serial_number: str


class DeviceCommandUpdate(BaseModel):
    """Schema for updating command status from device."""

    status: CommandStatus
    result: Optional[str] = None
    error: Optional[str] = None
