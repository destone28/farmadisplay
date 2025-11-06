"""Shift schemas for request/response validation."""
from __future__ import annotations

from datetime import date, datetime, time
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class ShiftBase(BaseModel):
    """Base shift schema."""

    date: date
    start_time: time
    end_time: time
    is_recurring: bool = False
    recurrence_rule: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = None


class ShiftCreate(ShiftBase):
    """Schema for creating a new shift."""

    pharmacy_id: UUID


class ShiftUpdate(BaseModel):
    """Schema for updating shift information."""

    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_recurring: Optional[bool] = None
    recurrence_rule: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = None


class ShiftResponse(ShiftBase):
    """Schema for shift response."""

    id: UUID
    pharmacy_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        """Pydantic config."""
        from_attributes = True


class ShiftWithPharmacy(ShiftResponse):
    """Schema for shift response with pharmacy details."""

    pharmacy_name: str
    pharmacy_address: Optional[str] = None
    pharmacy_phone: Optional[str] = None
