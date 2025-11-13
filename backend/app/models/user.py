"""User model."""

import uuid
from enum import Enum
from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class UserRole(str, Enum):
    """User role enumeration."""

    ADMIN = "admin"
    USER = "user"


class User(Base):
    """User model for authentication and authorization."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(ENUM(UserRole, name="user_role"), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    # Additional optional fields
    phone = Column(String(20), nullable=True)
    city = Column(String(100), nullable=True)
    postal_code = Column(String(10), nullable=True)
    address = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    pharmacies = relationship("Pharmacy", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        """String representation."""
        return f"<User {self.username}>"
