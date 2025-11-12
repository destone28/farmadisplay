"""Pharmacy model."""

import uuid
from sqlalchemy import Boolean, Column, DateTime, String, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Pharmacy(Base):
    """Pharmacy model for managing pharmacy information."""

    __tablename__ = "pharmacies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    address = Column(String(500))
    city = Column(String(100))
    postal_code = Column(String(10))
    phone = Column(String(20))
    email = Column(String(255))
    # Location coordinates - compatible with SQLite and PostgreSQL
    longitude = Column(Float, nullable=True)
    latitude = Column(Float, nullable=True)
    logo_url = Column(String(500))  # Deprecated - use logo_path instead
    logo_path = Column(String(500))  # Path to uploaded logo file
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="pharmacies")
    shifts = relationship("Shift", back_populates="pharmacy", cascade="all, delete-orphan")
    devices = relationship("Device", back_populates="pharmacy")
    display_config = relationship("DisplayConfig", back_populates="pharmacy", uselist=False, cascade="all, delete-orphan")

    def __repr__(self) -> str:
        """String representation."""
        return f"<Pharmacy {self.name}>"
