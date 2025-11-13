"""Pharmacies API endpoints."""

from typing import List
from uuid import UUID
import os
import uuid
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.models.pharmacy import Pharmacy
from app.models.device import Device, DeviceStatus
from app.schemas.pharmacy import PharmacyCreate, PharmacyUpdate, PharmacyResponse, PharmacyConfigDownload
from app.dependencies import CurrentUser, get_current_user, require_admin
from app.utils.pagination import paginate, PaginatedResponse
from app.utils.display_id import generate_display_id

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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new pharmacy.

    Validations:
    - Name required, max 255 characters
    - Logo URL max 500 characters
    - GPS coordinates: latitude -90/90, longitude -180/180
    """
    # Extract location coordinates
    longitude = None
    latitude = None
    if pharmacy_in.location:
        longitude = pharmacy_in.location.longitude
        latitude = pharmacy_in.location.latitude

    # Generate unique display ID
    display_id = generate_display_id(db)

    # Create pharmacy
    pharmacy_data = pharmacy_in.dict(exclude={"location"})
    pharmacy = Pharmacy(
        **pharmacy_data,
        user_id=current_user.id,
        display_id=display_id,
        longitude=longitude,
        latitude=latitude
    )

    db.add(pharmacy)
    db.commit()
    db.refresh(pharmacy)

    return pharmacy


@router.get("/by-display-id/{display_id}", response_model=PharmacyResponse)
async def get_pharmacy_by_display_id(
    display_id: str,
    db: Session = Depends(get_db)
):
    """
    Get pharmacy details by public display ID.

    This endpoint is public and used by the display page.
    No authentication required.
    """
    pharmacy = db.query(Pharmacy).filter(
        Pharmacy.display_id == display_id,
        Pharmacy.is_active == True
    ).first()

    if not pharmacy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Display not found"
        )

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
        pharmacy.longitude = pharmacy_in.location.longitude
        pharmacy.latitude = pharmacy_in.location.latitude

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


def delete_file_if_exists(file_path: str | None):
    """Delete file from filesystem if it exists."""
    if file_path and file_path.startswith("/uploads/"):
        try:
            # Remove leading slash and construct full path
            rel_path = file_path[1:]  # Remove leading /
            full_path = Path(rel_path)
            if full_path.exists():
                full_path.unlink()
        except Exception as e:
            print(f"Warning: Could not delete file {file_path}: {e}")


@router.post("/{pharmacy_id}/upload-logo")
def upload_pharmacy_logo(
    pharmacy_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload logo for pharmacy."""

    # Convert pharmacy_id to UUID
    try:
        pharmacy_uuid = UUID(pharmacy_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid pharmacy_id format")

    # Verify ownership
    pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_uuid).first()
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")

    if pharmacy.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Delete old logo if exists
    delete_file_if_exists(pharmacy.logo_path)

    # Save file
    file_extension = os.path.splitext(file.filename)[1]
    if file_extension.lower() not in ['.jpg', '.jpeg', '.png']:
        raise HTTPException(status_code=400, detail="Only JPG and PNG files are allowed")

    unique_filename = f"{uuid.uuid4()}{file_extension}"
    upload_dir = Path("uploads/pharmacy_logos")
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / unique_filename
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    # Update pharmacy logo_path
    pharmacy.logo_path = f"/uploads/pharmacy_logos/{unique_filename}"
    db.commit()
    db.refresh(pharmacy)

    return {"logo_path": pharmacy.logo_path}


@router.post("/{pharmacy_id}/generate-config")
def generate_pharmacy_config(
    pharmacy_id: str,
    config_data: PharmacyConfigDownload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Generate configuration JSON for Raspberry Pi display.

    Admin only endpoint that generates a JSON configuration file containing:
    - Pharmacy name and IDs
    - WiFi SSID and password
    - Display ID for public access

    RBAC:
    - Only admins can generate configurations
    """
    # Convert pharmacy_id to UUID
    try:
        pharmacy_uuid = UUID(pharmacy_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid pharmacy_id format")

    # Get pharmacy
    pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_uuid).first()
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")

    # Validate pharmacy_id matches the one in the body
    if pharmacy.id != config_data.pharmacy_id:
        raise HTTPException(
            status_code=400,
            detail="Pharmacy ID mismatch"
        )

    # Check if pharmacy has wifi_ssid configured
    if not pharmacy.wifi_ssid:
        raise HTTPException(
            status_code=400,
            detail="WiFi SSID not configured for this pharmacy. Please update pharmacy settings first."
        )

    # Generate configuration JSON
    config_json = {
        "pharmacy_name": pharmacy.name,
        "pharmacy_id": str(pharmacy.id),
        "display_id": pharmacy.display_id,
        "wifi_ssid": pharmacy.wifi_ssid,
        "wifi_password": config_data.wifi_password,
        "display_url": f"http://localhost:5173/display/{pharmacy.display_id}",
        "generated_at": datetime.now().isoformat()
    }

    return config_json
