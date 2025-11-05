"""Device model."""

import uuid
from enum import Enum
from sqlalchemy import Column, DateTime, String, ForeignKey
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

    # Relationships
    pharmacy = relationship("Pharmacy", back_populates="devices")

    def __repr__(self) -> str:
        """String representation."""
        return f"<Device {self.serial_number}>"
