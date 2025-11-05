"""Pagination utilities."""

from typing import Generic, TypeVar, List
from pydantic import BaseModel
from sqlalchemy.orm import Query

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response model."""

    items: List[T]
    total: int
    skip: int
    limit: int
    has_more: bool

    class Config:
        """Pydantic config."""
        from_attributes = True


def paginate(query: Query, skip: int, limit: int) -> dict:
    """
    Paginate a SQLAlchemy query.

    Args:
        query: SQLAlchemy query to paginate
        skip: Number of items to skip
        limit: Maximum number of items to return

    Returns:
        Dictionary with pagination metadata and items
    """
    total = query.count()
    items = query.offset(skip).limit(limit).all()

    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total
    }
