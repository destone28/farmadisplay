"""Users API endpoints."""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.dependencies import get_current_user, require_admin
from app.utils.pagination import paginate, PaginatedResponse
from app.services.authentication import AuthenticationService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=PaginatedResponse[UserResponse])
async def list_users(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of items to return"),
    search: str | None = Query(None, description="Search in username, email, or city"),
    role: UserRole | None = Query(None, description="Filter by role"),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """
    List users with pagination and search.

    RBAC:
    - Only admins can access this endpoint

    Filters:
    - search: Search in username, email, and city (case-insensitive)
    - role: Filter by user role (admin/user)
    - skip/limit: Pagination parameters
    """
    query = db.query(User)

    # Role filter
    if role:
        query = query.filter(User.role == role)

    # Search filter
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                User.username.ilike(search_filter),
                User.email.ilike(search_filter),
                User.city.ilike(search_filter)
            )
        )

    # Only active users
    query = query.filter(User.is_active == True)

    # Order by username
    query = query.order_by(User.username)

    # Paginate
    result = paginate(query, skip, limit)

    return result


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """
    Create a new user.

    RBAC:
    - Only admins can create users

    Validations:
    - Username must be unique and between 3-50 characters
    - Password must be at least 8 characters with uppercase, lowercase, and digit
    - Email must be unique if provided
    """
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_in.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Check if email already exists (if provided)
    if user_in.email:
        existing_email = db.query(User).filter(User.email == user_in.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

    # Hash password
    auth_service = AuthenticationService(db)
    password_hash = auth_service.hash_password(user_in.password)

    # Create user
    user_data = user_in.dict(exclude={"password"})
    user = User(
        **user_data,
        password_hash=password_hash
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """
    Get user details.

    RBAC:
    - Only admins can access this endpoint
    """
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """
    Update user information.

    RBAC:
    - Only admins can update users

    Note:
    - Password cannot be changed through this endpoint
    - Use the password reset endpoint instead
    """
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check username uniqueness if being updated
    if user_in.username and user_in.username != user.username:
        existing_user = db.query(User).filter(User.username == user_in.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )

    # Check email uniqueness if being updated
    if user_in.email and user_in.email != user.email:
        existing_email = db.query(User).filter(User.email == user_in.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already taken"
            )

    # Update fields
    update_data = user_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Delete user (soft delete).

    RBAC:
    - Only admins can delete users
    - Admins cannot delete themselves

    Side effects:
    - Deactivates all associated pharmacies
    """
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent self-deletion
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    # Soft delete user
    user.is_active = False

    # Soft delete all associated pharmacies
    from app.models.pharmacy import Pharmacy
    db.query(Pharmacy).filter(
        Pharmacy.user_id == user.id
    ).update({"is_active": False})

    db.commit()

    return None
