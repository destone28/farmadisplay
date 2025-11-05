"""Pharmacy schemas for request/response validation."""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class LocationData(BaseModel):
    """Schema for location coordinates."""

    longitude: float = Field(..., ge=-180, le=180)
    latitude: float = Field(..., ge=-90, le=90)


class PharmacyBase(BaseModel):
    """Base pharmacy schema."""

    name: str = Field(..., min_length=1, max_length=255)
    address: str | None = Field(None, max_length=500)
    city: str | None = Field(None, max_length=100)
    postal_code: str | None = Field(None, max_length=10)
    phone: str | None = Field(None, max_length=20)
    email: EmailStr | None = None
    logo_url: str | None = Field(None, max_length=500)


class PharmacyCreate(PharmacyBase):
    """Schema for creating a new pharmacy."""

    location: LocationData | None = None


class PharmacyUpdate(BaseModel):
    """Schema for updating pharmacy information."""

    name: str | None = Field(None, min_length=1, max_length=255)
    address: str | None = Field(None, max_length=500)
    city: str | None = Field(None, max_length=100)
    postal_code: str | None = Field(None, max_length=10)
    phone: str | None = Field(None, max_length=20)
    email: EmailStr | None = None
    location: LocationData | None = None
    logo_url: str | None = Field(None, max_length=500)
    is_active: bool | None = None


class PharmacyResponse(PharmacyBase):
    """Schema for pharmacy response."""

    id: UUID
    user_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime | None

    class Config:
        """Pydantic config."""
        from_attributes = True


class PharmacyWithLocation(PharmacyResponse):
    """Schema for pharmacy response with location data."""

    location: LocationData | None = None
