"""Device model."""

import uuid
from enum import Enum
from sqlalchemy import Column, DateTime, String, ForeignKey, Integer, Float, Text
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class DeviceStatus(str, Enum):
    """Device status enumeration."""

    PENDING = "pending"
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"
    OFFLINE = "offline"


class CommandStatus(str, Enum):
    """Command execution status enumeration."""

    PENDING = "pending"
    SENT = "sent"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Device(Base):
    """Device model for managing Raspberry Pi devices."""

    __tablename__ = "devices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    serial_number = Column(String(100), unique=True, nullable=False, index=True)
    mac_address = Column(String(17), unique=True)
    activation_code = Column(String(20), unique=True, nullable=False, index=True)
    pharmacy_id = Column(UUID(as_uuid=True), ForeignKey("pharmacies.id"))
    status = Column(ENUM(DeviceStatus, name="device_status"), default=DeviceStatus.PENDING, nullable=False)
    last_seen = Column(DateTime(timezone=True))
    firmware_version = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    activated_at = Column(DateTime(timezone=True))

    # Remote monitoring fields
    ip_address = Column(String(45))  # IPv4 (15) or IPv6 (45)
    uptime_seconds = Column(Integer)
    cpu_usage = Column(Float)  # Percentage 0-100
    memory_usage = Column(Float)  # Percentage 0-100
    disk_usage = Column(Float)  # Percentage 0-100
    temperature = Column(Float)  # Celsius
    last_heartbeat = Column(DateTime(timezone=True))

    # Relationships
    pharmacy = relationship("Pharmacy", back_populates="devices")
    commands = relationship("DeviceCommand", back_populates="device", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        """String representation."""
        return f"<Device {self.serial_number}>"

    @property
    def is_online(self) -> bool:
        """Check if device is online (heartbeat within last 5 minutes)."""
        if not self.last_heartbeat:
            return False
        from datetime import datetime, timedelta
        return datetime.utcnow() - self.last_heartbeat < timedelta(minutes=5)


class DeviceCommand(Base):
    """Command queue for device remote control."""

    __tablename__ = "device_commands"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id"), nullable=False, index=True)
    command_type = Column(String(50), nullable=False)  # reboot, update, ssh_tunnel, execute
    command_data = Column(Text)  # JSON payload for command parameters
    status = Column(ENUM(CommandStatus, name="command_status"), default=CommandStatus.PENDING, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    sent_at = Column(DateTime(timezone=True))
    executed_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    result = Column(Text)  # Execution result or error message
    error = Column(Text)  # Error details if failed

    # Relationships
    device = relationship("Device", back_populates="commands")
    creator = relationship("User")

    def __repr__(self) -> str:
        """String representation."""
        return f"<DeviceCommand {self.command_type} for {self.device_id}>"
