"""Shift schemas for request/response validation."""

from datetime import date, datetime, time
from uuid import UUID
from pydantic import BaseModel, Field


class ShiftBase(BaseModel):
    """Base shift schema."""

    date: date
    start_time: time
    end_time: time
    is_recurring: bool = False
    recurrence_rule: str | None = Field(None, max_length=255)
    notes: str | None = None


class ShiftCreate(ShiftBase):
    """Schema for creating a new shift."""

    pharmacy_id: UUID


class ShiftUpdate(BaseModel):
    """Schema for updating shift information."""

    date: date | None = None
    start_time: time | None = None
    end_time: time | None = None
    is_recurring: bool | None = None
    recurrence_rule: str | None = Field(None, max_length=255)
    notes: str | None = None


class ShiftResponse(ShiftBase):
    """Schema for shift response."""

    id: UUID
    pharmacy_id: UUID
    created_at: datetime
    updated_at: datetime | None

    class Config:
        """Pydantic config."""
        from_attributes = True


class ShiftWithPharmacy(ShiftResponse):
    """Schema for shift response with pharmacy details."""

    pharmacy_name: str
    pharmacy_address: str | None = None
    pharmacy_phone: str | None = None
