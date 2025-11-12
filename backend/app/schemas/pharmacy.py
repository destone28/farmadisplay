"""Pharmacy schemas for request/response validation."""
from __future__ import annotations


from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class LocationData(BaseModel):
    """Schema for location coordinates."""

    longitude: float = Field(..., ge=-180, le=180)
    latitude: float = Field(..., ge=-90, le=90)


class PharmacyBase(BaseModel):
    """Base pharmacy schema."""

    name: str = Field(..., min_length=1, max_length=255)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=10)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    logo_url: Optional[str] = Field(None, max_length=500)  # Deprecated
    logo_path: Optional[str] = Field(None, max_length=500)


class PharmacyCreate(PharmacyBase):
    """Schema for creating a new pharmacy."""

    location: Optional[LocationData] = None


class PharmacyUpdate(BaseModel):
    """Schema for updating pharmacy information."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=10)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    location: Optional[LocationData] = None
    logo_url: Optional[str] = Field(None, max_length=500)  # Deprecated
    logo_path: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


class PharmacyResponse(PharmacyBase):
    """Schema for pharmacy response."""

    id: UUID
    user_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        """Pydantic config."""
        from_attributes = True


class PharmacyWithLocation(PharmacyResponse):
    """Schema for pharmacy response with location data."""

    location: Optional[LocationData] = None
