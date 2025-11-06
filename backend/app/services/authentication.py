"""
Authentication Service
Implements secure authentication with integrated security features
"""
import os
import re
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
import redis.asyncio as redis

from app.core.account_lockout import AccountLockoutManager, get_lockout_manager
from app.core.security_logging import (
    log_login_success,
    log_login_failure,
    log_account_locked,
    log_brute_force_detected,
    SecurityEventType,
    get_security_logger
)


# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


class AuthenticationService:
    """
    Comprehensive authentication service with security features.

    Integrates:
    - Password hashing with bcrypt
    - JWT token generation and validation
    - Account lockout mechanism
    - Security event logging
    - Password strength validation
    """

    def __init__(self, redis_client: Optional[redis.Redis] = None):
        """
        Initialize the authentication service.

        Args:
            redis_client: Optional Redis client for account lockout
        """
        # Password hashing context with bcrypt (cost factor 12)
        self.pwd_context = CryptContext(
            schemes=["bcrypt"],
            deprecated="auto",
            bcrypt__rounds=12  # Cost factor for bcrypt
        )

        # JWT configuration
        self.secret_key = SECRET_KEY
        self.algorithm = ALGORITHM
        self.access_token_expire_minutes = ACCESS_TOKEN_EXPIRE_MINUTES

        # Account lockout manager
        self.lockout_manager = get_lockout_manager(redis_client)

        # Security logger
        self.security_logger = get_security_logger()

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verify a password against its hash.

        Args:
            plain_password: Plain text password
            hashed_password: Hashed password to compare against

        Returns:
            True if password matches, False otherwise
        """
        return self.pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """
        Hash a password using bcrypt.

        Args:
            password: Plain text password to hash

        Returns:
            Hashed password string
        """
        return self.pwd_context.hash(password)

    def create_access_token(
        self,
        data: Dict[str, Any],
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        Create a JWT access token.

        Args:
            data: Data to encode in the token
            expires_delta: Optional custom expiration time

        Returns:
            Encoded JWT token string
        """
        to_encode = data.copy()

        # Set expiration time
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)

        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow()
        })

        # Encode token
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def decode_token(self, token: str) -> Dict[str, Any]:
        """
        Decode and validate a JWT token.

        Args:
            token: JWT token string to decode

        Returns:
            Decoded token payload

        Raises:
            HTTPException: If token is invalid or expired
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            ) from e

    async def authenticate_user(
        self,
        username: str,
        password: str,
        request: Request,
        db_user: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Authenticate a user with comprehensive security checks.

        Integrates:
        - Account lockout checking
        - Password verification
        - Security event logging
        - Failed attempt tracking

        Args:
            username: Username for authentication
            password: Plain text password
            request: FastAPI request object (for IP, user agent)
            db_user: Optional user object from database

        Returns:
            Dictionary with authentication result and user data

        Raises:
            HTTPException: If authentication fails or account is locked
        """
        # Get client information
        ip_address = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "unknown")

        # Check if account is locked out
        try:
            is_locked = await self.lockout_manager.is_locked_out(username)
            if is_locked:
                remaining_time = await self.lockout_manager.get_lockout_remaining_time(username)

                # Log account locked attempt
                log_account_locked(
                    username=username,
                    failed_attempts=await self.lockout_manager.get_failed_attempts_count(username),
                    ip_address=ip_address
                )

                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "error": "account_locked",
                        "message": f"Account temporarily locked. Try again in {remaining_time} seconds.",
                        "locked_until_seconds": remaining_time
                    }
                )
        except HTTPException:
            raise

        # Check if user exists
        if not db_user:
            # Record failed attempt
            try:
                await self.lockout_manager.record_failed_attempt(username)
            except HTTPException:
                raise

            # Log failed login
            log_login_failure(
                username=username,
                reason="user_not_found",
                ip_address=ip_address,
                user_agent=user_agent
            )

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Verify password
        password_valid = self.verify_password(password, db_user.get("hashed_password", ""))

        if not password_valid:
            # Record failed attempt
            try:
                attempt_info = await self.lockout_manager.record_failed_attempt(username)

                # Check if approaching lockout
                if attempt_info["remaining_attempts"] <= 2:
                    log_brute_force_detected(
                        username=username,
                        ip_address=ip_address,
                        attempts=attempt_info["failed_attempts"]
                    )

            except HTTPException:
                raise

            # Log failed login
            log_login_failure(
                username=username,
                reason="invalid_password",
                ip_address=ip_address,
                user_agent=user_agent
            )

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Authentication successful - reset failed attempts
        await self.lockout_manager.reset_failed_attempts(username)

        # Log successful login
        log_login_success(
            username=username,
            ip_address=ip_address,
            user_agent=user_agent
        )

        # Return user data
        return {
            "authenticated": True,
            "user_id": db_user.get("id"),
            "username": username,
            "email": db_user.get("email"),
            "role": db_user.get("role"),
            "ip_address": ip_address
        }

    def validate_password_strength(self, password: str) -> bool:
        """
        Validate password meets strength requirements.

        Requirements:
        - Minimum 8 characters
        - At least 1 uppercase letter
        - At least 1 lowercase letter
        - At least 1 digit
        - At least 1 special character

        Args:
            password: Password to validate

        Returns:
            True if password meets requirements, False otherwise

        Raises:
            HTTPException: With detailed validation error message
        """
        # Minimum length check
        if len(password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long"
            )

        # Maximum length check (prevent DoS)
        if len(password) > 128:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must not exceed 128 characters"
            )

        # Uppercase check
        if not re.search(r"[A-Z]", password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one uppercase letter"
            )

        # Lowercase check
        if not re.search(r"[a-z]", password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one lowercase letter"
            )

        # Digit check
        if not re.search(r"\d", password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one digit"
            )

        # Special character check
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one special character"
            )

        return True

    def _get_client_ip(self, request: Request) -> str:
        """
        Get client IP address from request.

        Args:
            request: FastAPI request object

        Returns:
            Client IP address string
        """
        # Check X-Forwarded-For header (if behind proxy)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # Take first IP in the list
            return forwarded_for.split(",")[0].strip()

        # Check X-Real-IP header
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        # Fallback to direct client IP
        if request.client:
            return request.client.host

        return "unknown"

    async def validate_token(self, token: str) -> Dict[str, Any]:
        """
        Validate a JWT token and return payload.

        Args:
            token: JWT token string

        Returns:
            Token payload dictionary

        Raises:
            HTTPException: If token is invalid
        """
        return self.decode_token(token)

    async def refresh_token(self, current_token: str) -> str:
        """
        Refresh a JWT token (create new token with extended expiry).

        Args:
            current_token: Current valid JWT token

        Returns:
            New JWT token string

        Raises:
            HTTPException: If current token is invalid
        """
        # Decode current token
        payload = self.decode_token(current_token)

        # Create new token with fresh expiration
        new_payload = {
            "sub": payload.get("sub"),
            "email": payload.get("email"),
            "role": payload.get("role")
        }

        return self.create_access_token(new_payload)


# Global authentication service instance
_auth_service: Optional[AuthenticationService] = None


def get_auth_service(redis_client: Optional[redis.Redis] = None) -> AuthenticationService:
    """
    Get or create the global authentication service instance.

    Args:
        redis_client: Optional Redis client

    Returns:
        AuthenticationService instance
    """
    global _auth_service
    if _auth_service is None:
        _auth_service = AuthenticationService(redis_client)
    return _auth_service
