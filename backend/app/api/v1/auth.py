"""Authentication API endpoints."""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.utils.security import verify_password, get_password_hash, create_access_token
from app.dependencies import CurrentUser
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
) -> User:
    """
    Register a new user.

    Args:
        user_data: User registration data
        db: Database session

    Returns:
        The created user

    Raises:
        HTTPException: If username or email already exists
    """
    # Check if username exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Check if email exists (if provided)
    if user_data.email and db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
) -> dict[str, str]:
    """
    Login with username and password.

    Args:
        credentials: User login credentials
        db: Database session

    Returns:
        Access token and token type

    Raises:
        HTTPException: If credentials are invalid
    """
    # Find user by username
    user = db.query(User).filter(User.username == credentials.username).first()

    # Verify credentials
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Create access token
    access_token_expires = timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: CurrentUser) -> User:
    """
    Get current authenticated user information.

    Args:
        current_user: The authenticated user

    Returns:
        Current user information
    """
    return current_user


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    username: str,
    db: Session = Depends(get_db)
) -> dict[str, str]:
    """
    Request password reset (placeholder - email functionality to be implemented).

    Args:
        username: Username for password reset
        db: Database session

    Returns:
        Success message
    """
    # Find user
    user = db.query(User).filter(User.username == username).first()

    if not user:
        # Don't reveal if user exists or not (security best practice)
        return {"message": "If the username exists, a password reset email will be sent"}

    # TODO: Implement email sending logic with reset token
    # For now, just return success message
    return {"message": "If the username exists, a password reset email will be sent"}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    token: str,
    new_password: str,
    db: Session = Depends(get_db)
) -> dict[str, str]:
    """
    Reset password with token (placeholder - to be fully implemented).

    Args:
        token: Password reset token
        new_password: New password
        db: Database session

    Returns:
        Success message

    Raises:
        HTTPException: If token is invalid
    """
    # TODO: Implement token validation and password reset logic
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Password reset functionality not yet implemented"
    )
