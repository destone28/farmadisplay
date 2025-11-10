"""Display configuration API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
from uuid import UUID
from pathlib import Path

from app.database import get_db
from app.models.display_config import DisplayConfig
from app.models.pharmacy import Pharmacy
from app.schemas.display_config import DisplayConfigCreate, DisplayConfigUpdate, DisplayConfigResponse
from app.dependencies import get_current_user
from app.models.user import User, UserRole

router = APIRouter()

# Upload directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def save_upload_file(upload_file: UploadFile, subfolder: str = "images") -> str:
    """Save uploaded file and return path."""
    # Validate extension
    file_ext = Path(upload_file.filename).suffix.lower() if upload_file.filename else ""
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    save_dir = UPLOAD_DIR / subfolder
    save_dir.mkdir(parents=True, exist_ok=True)

    file_path = save_dir / unique_filename

    # Save file
    with open(file_path, "wb") as f:
        content = upload_file.file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Max size: {MAX_FILE_SIZE / 1024 / 1024}MB"
            )
        f.write(content)

    # Return relative path
    return f"/uploads/{subfolder}/{unique_filename}"


def delete_file_if_exists(file_path: Optional[str]):
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


@router.post("/", response_model=DisplayConfigResponse)
def create_display_config(
    config: DisplayConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create display configuration for pharmacy."""

    # Convert pharmacy_id to UUID
    try:
        pharmacy_uuid = UUID(config.pharmacy_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid pharmacy_id format")

    # Verify pharmacy exists and user owns it
    pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_uuid).first()
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")

    if pharmacy.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Check if config already exists
    existing = db.query(DisplayConfig).filter(DisplayConfig.pharmacy_id == config.pharmacy_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Display config already exists for this pharmacy")

    # Create config
    db_config = DisplayConfig(**config.dict())
    db.add(db_config)
    db.commit()
    db.refresh(db_config)

    return db_config


@router.get("/{pharmacy_id}", response_model=DisplayConfigResponse)
def get_display_config(
    pharmacy_id: str,
    db: Session = Depends(get_db)
):
    """Get display configuration (public endpoint for display page)."""

    config = db.query(DisplayConfig).filter(DisplayConfig.pharmacy_id == pharmacy_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Display config not found")

    return config


@router.put("/{pharmacy_id}", response_model=DisplayConfigResponse)
def update_display_config(
    pharmacy_id: str,
    config_update: DisplayConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update display configuration."""

    # Convert pharmacy_id to UUID
    try:
        pharmacy_uuid = UUID(pharmacy_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid pharmacy_id format")

    # Verify pharmacy exists and user owns it
    pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_uuid).first()
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")

    if pharmacy.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get config
    config = db.query(DisplayConfig).filter(DisplayConfig.pharmacy_id == pharmacy_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Display config not found")

    # Update fields
    update_data = config_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)

    db.commit()
    db.refresh(config)

    return config


@router.post("/{pharmacy_id}/upload-logo")
def upload_logo(
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

    # Get or create config
    config = db.query(DisplayConfig).filter(DisplayConfig.pharmacy_id == pharmacy_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Create display config first")

    # Delete old logo if exists
    delete_file_if_exists(config.logo_path)

    # Save file
    file_path = save_upload_file(file, "logos")

    # Update config
    config.logo_path = file_path
    db.commit()

    return {"logo_path": file_path}


@router.post("/{pharmacy_id}/upload-image")
def upload_display_image(
    pharmacy_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload main display image/PDF."""

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

    # Get config
    config = db.query(DisplayConfig).filter(DisplayConfig.pharmacy_id == pharmacy_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Create display config first")

    # Delete old image if exists
    delete_file_if_exists(config.image_path)

    # Save file
    file_path = save_upload_file(file, "display_images")

    # Update config
    config.image_path = file_path
    config.display_mode = "image"  # Auto-set to image mode
    db.commit()

    return {"image_path": file_path}


@router.delete("/{pharmacy_id}")
def delete_display_config(
    pharmacy_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete display configuration."""

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

    config = db.query(DisplayConfig).filter(DisplayConfig.pharmacy_id == pharmacy_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Display config not found")

    # Delete associated files
    delete_file_if_exists(config.logo_path)
    delete_file_if_exists(config.image_path)

    db.delete(config)
    db.commit()

    return {"message": "Display config deleted"}
