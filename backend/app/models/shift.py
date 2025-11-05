"""Shift model."""

import uuid
from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Index, String, Text, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Shift(Base):
    """Shift model for managing pharmacy duty schedules."""

    __tablename__ = "shifts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pharmacy_id = Column(UUID(as_uuid=True), ForeignKey("pharmacies.id"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_recurring = Column(Boolean, default=False, nullable=False)
    recurrence_rule = Column(String(255))  # RRULE format (RFC 5545)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    pharmacy = relationship("Pharmacy", back_populates="shifts")

    # Indexes for performance
    __table_args__ = (
        Index('idx_shift_pharmacy_date', 'pharmacy_id', 'date'),
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"<Shift {self.pharmacy_id} on {self.date}>"
