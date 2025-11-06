"""Display API schemas."""
from __future__ import annotations


from datetime import date, time, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class DisplayPharmacyInfo(BaseModel):
    """Pharmacy information for display."""

    id: UUID
    name: str
    address: Optional[str]
    city: Optional[str]
    phone: Optional[str]
    logo_url: Optional[str]


class DisplayShiftInfo(BaseModel):
    """Shift information for display."""

    date: date
    start_time: time
    end_time: time
    notes: Optional[str]


class NearbyPharmacyInfo(BaseModel):
    """Nearby pharmacy information."""

    id: UUID
    name: str
    address: Optional[str]
    city: Optional[str]
    phone: Optional[str]
    distance_meters: float


class DisplayDataResponse(BaseModel):
    """Complete display data response."""

    pharmacy: DisplayPharmacyInfo
    current_shifts: list[DisplayShiftInfo]
    nearby_pharmacies: list[NearbyPharmacyInfo]
    messages: list[dict]  # Future feature
    updated_at: datetime
