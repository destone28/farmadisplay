"""User schemas for request/response validation."""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema."""

    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr | None = None


class UserCreate(UserBase):
    """Schema for creating a new user."""

    password: str = Field(..., min_length=8, max_length=100)
    role: UserRole = UserRole.USER

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserUpdate(BaseModel):
    """Schema for updating user information."""

    username: str | None = Field(None, min_length=3, max_length=50)
    email: EmailStr | None = None
    is_active: bool | None = None
    role: UserRole | None = None


class UserResponse(UserBase):
    """Schema for user response."""

    id: UUID
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime | None

    class Config:
        """Pydantic config."""
        from_attributes = True


class UserLogin(BaseModel):
    """Schema for user login."""

    username: str
    password: str


class Token(BaseModel):
    """Schema for authentication token."""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for token payload data."""

    sub: str | None = None
    role: str | None = None
