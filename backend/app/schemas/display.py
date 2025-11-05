"""Display API schemas."""

from datetime import date, time, datetime
from uuid import UUID
from pydantic import BaseModel


class DisplayPharmacyInfo(BaseModel):
    """Pharmacy information for display."""

    id: UUID
    name: str
    address: str | None
    city: str | None
    phone: str | None
    logo_url: str | None


class DisplayShiftInfo(BaseModel):
    """Shift information for display."""

    date: date
    start_time: time
    end_time: time
    notes: str | None


class NearbyPharmacyInfo(BaseModel):
    """Nearby pharmacy information."""

    id: UUID
    name: str
    address: str | None
    city: str | None
    phone: str | None
    distance_meters: float


class DisplayDataResponse(BaseModel):
    """Complete display data response."""

    pharmacy: DisplayPharmacyInfo
    current_shifts: list[DisplayShiftInfo]
    nearby_pharmacies: list[NearbyPharmacyInfo]
    messages: list[dict]  # Future feature
    updated_at: datetime
