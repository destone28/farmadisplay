"""Tests for authentication endpoints."""

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from jose import jwt

from app.config import get_settings
from app.models.user import User, UserRole
from app.utils.security import verify_password, get_password_hash, create_access_token, decode_token

settings = get_settings()


class TestPasswordHashing:
    """Test password hashing functionality."""

    def test_password_hashing(self):
        """Test that password hashing works correctly."""
        password = "TestPassword123!"
        hashed = get_password_hash(password)

        assert hashed != password
        assert verify_password(password, hashed)

    def test_wrong_password_fails(self):
        """Test that wrong password verification fails."""
        password = "TestPassword123!"
        hashed = get_password_hash(password)

        assert not verify_password("WrongPassword", hashed)


class TestJWTTokens:
    """Test JWT token generation and validation."""

    def test_jwt_token_generation(self):
        """Test that JWT tokens are generated correctly."""
        token = create_access_token(data={"sub": "test-user-id", "role": "user"})

        assert token is not None
        assert isinstance(token, str)

    def test_jwt_token_decode(self):
        """Test that JWT tokens can be decoded."""
        user_id = "test-user-id"
        role = "admin"
        token = create_access_token(data={"sub": user_id, "role": role})

        payload = decode_token(token)

        assert payload["sub"] == user_id
        assert payload["role"] == role
        assert "exp" in payload
        assert "iat" in payload
        assert "jti" in payload

    def test_jwt_token_invalid(self):
        """Test that invalid tokens raise an error."""
        invalid_token = "invalid.token.here"

        with pytest.raises(Exception):
            decode_token(invalid_token)


class TestUserRegistration:
    """Test user registration endpoint."""

    def test_register_success(self, client: TestClient):
        """Test successful user registration."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "NewPass123!",
                "role": "user"
            }
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "newuser@example.com"
        assert data["role"] == "user"
        assert data["is_active"] is True
        assert "id" in data
        assert "password" not in data
        assert "password_hash" not in data

    def test_register_duplicate_username(self, client: TestClient, test_user: User):
        """Test that duplicate username registration fails."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": test_user.username,
                "email": "different@example.com",
                "password": "NewPass123!",
            }
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already registered" in response.json()["detail"].lower()

    def test_register_duplicate_email(self, client: TestClient, test_user: User):
        """Test that duplicate email registration fails."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "differentuser",
                "email": test_user.email,
                "password": "NewPass123!",
            }
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already registered" in response.json()["detail"].lower()

    def test_register_weak_password(self, client: TestClient):
        """Test that weak password validation works."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "weak",  # Too short, no uppercase, no numbers
            }
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_register_missing_fields(self, client: TestClient):
        """Test that missing required fields fail validation."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "newuser",
                # Missing password
            }
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestUserLogin:
    """Test user login endpoint."""

    def test_login_success(self, client: TestClient, test_user: User):
        """Test successful login."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "testuser",
                "password": "TestPassword123!"
            }
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

        # Verify token is valid
        token = data["access_token"]
        payload = decode_token(token)
        assert payload["sub"] == str(test_user.id)

    def test_login_invalid_password(self, client: TestClient, test_user: User):
        """Test login with wrong password."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "testuser",
                "password": "WrongPassword"
            }
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "incorrect" in response.json()["detail"].lower()

    def test_login_invalid_username(self, client: TestClient):
        """Test login with non-existent username."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "nonexistent",
                "password": "SomePassword123!"
            }
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_missing_fields(self, client: TestClient):
        """Test login with missing fields."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "testuser"
                # Missing password
            }
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_login_inactive_user(self, client: TestClient, db_session, test_user: User):
        """Test that inactive users cannot login."""
        # Deactivate user
        test_user.is_active = False
        db_session.commit()

        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "testuser",
                "password": "TestPassword123!"
            }
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "inactive" in response.json()["detail"].lower()


class TestGetCurrentUser:
    """Test get current user endpoint."""

    def test_get_current_user_success(self, client: TestClient, test_user: User, auth_headers: dict):
        """Test getting current user information."""
        response = client.get("/api/v1/auth/me", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["username"] == test_user.username
        assert data["email"] == test_user.email
        assert data["id"] == str(test_user.id)

    def test_get_current_user_no_token(self, client: TestClient):
        """Test that no token returns 403."""
        response = client.get("/api/v1/auth/me")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_current_user_invalid_token(self, client: TestClient):
        """Test that invalid token returns 401."""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid.token.here"}
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestAdminRole:
    """Test admin role requirement."""

    def test_admin_token_creation(self, admin_user: User):
        """Test admin user token contains admin role."""
        token = create_access_token(
            data={"sub": str(admin_user.id), "role": admin_user.role.value}
        )

        payload = decode_token(token)
        assert payload["role"] == "admin"

    def test_user_role_check(self, test_user: User):
        """Test that regular user has user role."""
        assert test_user.role == UserRole.USER

    def test_admin_role_check(self, admin_user: User):
        """Test that admin user has admin role."""
        assert admin_user.role == UserRole.ADMIN


class TestForgotPassword:
    """Test forgot password endpoint."""

    def test_forgot_password_existing_user(self, client: TestClient, test_user: User):
        """Test forgot password for existing user."""
        response = client.post(
            "/api/v1/auth/forgot-password",
            params={"username": test_user.username}
        )

        assert response.status_code == status.HTTP_200_OK
        assert "message" in response.json()

    def test_forgot_password_nonexistent_user(self, client: TestClient):
        """Test forgot password for non-existent user (should not reveal existence)."""
        response = client.post(
            "/api/v1/auth/forgot-password",
            params={"username": "nonexistent"}
        )

        # Should return success to not reveal user existence
        assert response.status_code == status.HTTP_200_OK
        assert "message" in response.json()
