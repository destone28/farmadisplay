"""Display configuration schemas."""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class DisplayMode(str, Enum):
    """Display mode enum."""
    IMAGE = "image"
    SCRAPED = "scraped"
    MANUAL = "manual"


class DisplayConfigBase(BaseModel):
    """Base schema per display config."""
    pharmacy_name: str = Field(..., min_length=1, max_length=200)
    pharmacy_hours: Optional[str] = Field(None, max_length=200)
    display_mode: DisplayMode = DisplayMode.IMAGE
    scraping_cap: Optional[str] = Field(None, max_length=10)
    scraping_city: Optional[str] = Field(None, max_length=200)
    scraping_province: Optional[str] = Field(None, max_length=2)
    footer_text: Optional[str] = None
    background_color: str = Field("#FFFFFF", pattern=r"^#[0-9A-Fa-f]{6}$")
    text_color: str = Field("#000000", pattern=r"^#[0-9A-Fa-f]{6}$")


class DisplayConfigCreate(DisplayConfigBase):
    """Schema per creazione."""
    pharmacy_id: str  # UUID as string


class DisplayConfigUpdate(BaseModel):
    """Schema per update (tutti campi opzionali)."""
    pharmacy_name: Optional[str] = None
    pharmacy_hours: Optional[str] = None
    display_mode: Optional[DisplayMode] = None
    scraping_cap: Optional[str] = None
    scraping_city: Optional[str] = None
    scraping_province: Optional[str] = None
    footer_text: Optional[str] = None
    background_color: Optional[str] = None
    text_color: Optional[str] = None


class DisplayConfigResponse(DisplayConfigBase):
    """Schema per response."""
    id: int
    pharmacy_id: str
    logo_path: Optional[str]
    image_path: Optional[str]

    class Config:
        from_attributes = True
