"""Pharmacies API endpoints."""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from geoalchemy2.functions import ST_GeomFromText

from app.database import get_db
from app.models.user import User, UserRole
from app.models.pharmacy import Pharmacy
from app.models.device import Device, DeviceStatus
from app.schemas.pharmacy import PharmacyCreate, PharmacyUpdate, PharmacyResponse
from app.dependencies import CurrentUser, get_current_user
from app.utils.pagination import paginate, PaginatedResponse

router = APIRouter(prefix="/pharmacies", tags=["pharmacies"])


async def require_pharmacy_access(
    pharmacy_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Pharmacy:
    """
    Verify user has access to pharmacy.

    Args:
        pharmacy_id: UUID of the pharmacy
        current_user: The authenticated user
        db: Database session

    Returns:
        The pharmacy if user has access

    Raises:
        HTTPException: If pharmacy not found or access denied
    """
    pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()

    if not pharmacy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pharmacy not found"
        )

    # Admin can access all pharmacies
    if current_user.role == UserRole.ADMIN:
        return pharmacy

    # User can only access own pharmacies
    if pharmacy.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return pharmacy


@router.get("/", response_model=PaginatedResponse[PharmacyResponse])
async def list_pharmacies(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of items to return"),
    search: str | None = Query(None, description="Search in name, city, or address"),
    current_user: CurrentUser = None,
    db: Session = Depends(get_db)
):
    """
    List pharmacies with pagination and search.

    RBAC:
    - Users see only their own pharmacies
    - Admins see all pharmacies

    Filters:
    - search: Search in name, city, and address (case-insensitive)
    - skip/limit: Pagination parameters
    """
    query = db.query(Pharmacy)

    # RBAC filtering
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Pharmacy.user_id == current_user.id)

    # Search filter
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Pharmacy.name.ilike(search_filter),
                Pharmacy.city.ilike(search_filter),
                Pharmacy.address.ilike(search_filter)
            )
        )

    # Only active pharmacies
    query = query.filter(Pharmacy.is_active == True)

    # Order by name
    query = query.order_by(Pharmacy.name)

    # Paginate
    result = paginate(query, skip, limit)

    return result


@router.post("/", response_model=PharmacyResponse, status_code=status.HTTP_201_CREATED)
async def create_pharmacy(
    pharmacy_in: PharmacyCreate,
    current_user: CurrentUser = None,
    db: Session = Depends(get_db)
):
    """
    Create a new pharmacy.

    Validations:
    - Name required, max 255 characters
    - Logo URL max 500 characters
    - GPS coordinates: latitude -90/90, longitude -180/180
    - PostGIS Point for geolocation
    """
    # Extract location data
    location_data = None
    if pharmacy_in.location:
        # Create PostGIS Point from coordinates
        # Format: POINT(longitude latitude)
        location_data = ST_GeomFromText(
            f"POINT({pharmacy_in.location.longitude} {pharmacy_in.location.latitude})",
            4326  # WGS84 SRID
        )

    # Create pharmacy
    pharmacy_data = pharmacy_in.dict(exclude={"location"})
    pharmacy = Pharmacy(
        **pharmacy_data,
        user_id=current_user.id,
        location=location_data
    )

    db.add(pharmacy)
    db.commit()
    db.refresh(pharmacy)

    return pharmacy


@router.get("/{pharmacy_id}", response_model=PharmacyResponse)
async def get_pharmacy(
    pharmacy: Pharmacy = Depends(require_pharmacy_access)
):
    """
    Get pharmacy details.

    RBAC:
    - Users can see only their own pharmacies
    - Admins can see all pharmacies
    """
    return pharmacy


@router.put("/{pharmacy_id}", response_model=PharmacyResponse)
async def update_pharmacy(
    pharmacy_in: PharmacyUpdate,
    pharmacy: Pharmacy = Depends(require_pharmacy_access),
    db: Session = Depends(get_db)
):
    """
    Update pharmacy information.

    RBAC:
    - Only owner or admin can update
    """
    # Update location if provided
    if pharmacy_in.location is not None:
        pharmacy.location = ST_GeomFromText(
            f"POINT({pharmacy_in.location.longitude} {pharmacy_in.location.latitude})",
            4326
        )

    # Update other fields
    update_data = pharmacy_in.dict(exclude_unset=True, exclude={"location"})
    for field, value in update_data.items():
        setattr(pharmacy, field, value)

    db.commit()
    db.refresh(pharmacy)

    return pharmacy


@router.delete("/{pharmacy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pharmacy(
    pharmacy: Pharmacy = Depends(require_pharmacy_access),
    db: Session = Depends(get_db)
):
    """
    Delete pharmacy (soft delete).

    RBAC:
    - Only owner or admin can delete

    Side effects:
    - Deactivates all associated devices
    """
    # Soft delete pharmacy
    pharmacy.is_active = False

    # Deactivate all associated devices
    db.query(Device).filter(
        Device.pharmacy_id == pharmacy.id
    ).update({"status": DeviceStatus.INACTIVE})

    db.commit()

    return None
