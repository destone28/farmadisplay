"""
Account Lockout Mechanism
Implements brute force protection through Redis-based account lockout
"""
import json
from datetime import datetime, timedelta
from typing import Optional, Dict
from fastapi import HTTPException, status
import redis.asyncio as redis


# Lockout configuration
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15
ATTEMPT_WINDOW_MINUTES = 30


class AccountLockoutManager:
    """
    Manages account lockout mechanism to prevent brute force attacks.

    Uses Redis to track failed login attempts and enforce temporary lockouts
    after exceeding the maximum number of failed attempts.
    """

    def __init__(self, redis_client: Optional[redis.Redis] = None):
        """
        Initialize the account lockout manager.

        Args:
            redis_client: Redis client instance (optional, will create if None)
        """
        self.redis_client = redis_client
        self.max_failed_attempts = MAX_FAILED_ATTEMPTS
        self.lockout_duration_minutes = LOCKOUT_DURATION_MINUTES
        self.attempt_window_minutes = ATTEMPT_WINDOW_MINUTES

    async def _get_redis_client(self) -> redis.Redis:
        """
        Get or create Redis client.

        Returns:
            Redis client instance
        """
        if self.redis_client is None:
            # Create Redis client with connection pooling
            self.redis_client = await redis.from_url(
                "redis://localhost:6379",
                encoding="utf-8",
                decode_responses=True,
                max_connections=10
            )
        return self.redis_client

    def _get_failed_attempts_key(self, username: str) -> str:
        """
        Generate Redis key for failed attempts counter.

        Args:
            username: Username to track

        Returns:
            Redis key string
        """
        return f"auth:failed_attempts:{username.lower()}"

    def _get_lockout_key(self, username: str) -> str:
        """
        Generate Redis key for lockout status.

        Args:
            username: Username to lock out

        Returns:
            Redis key string
        """
        return f"auth:lockout:{username.lower()}"

    async def is_locked_out(self, username: str) -> bool:
        """
        Check if an account is currently locked out.

        Args:
            username: Username to check

        Returns:
            True if account is locked out, False otherwise
        """
        client = await self._get_redis_client()
        lockout_key = self._get_lockout_key(username)

        # Check if lockout key exists
        lockout_data = await client.get(lockout_key)

        if lockout_data:
            # Parse lockout data
            try:
                lockout_info = json.loads(lockout_data)
                lockout_until = datetime.fromisoformat(lockout_info["locked_until"])

                # Check if lockout has expired
                if datetime.utcnow() < lockout_until:
                    return True
                else:
                    # Lockout expired, clean up
                    await client.delete(lockout_key)
                    return False
            except (json.JSONDecodeError, KeyError, ValueError):
                # Invalid data, clean up
                await client.delete(lockout_key)
                return False

        return False

    async def get_lockout_remaining_time(self, username: str) -> Optional[int]:
        """
        Get remaining lockout time in seconds.

        Args:
            username: Username to check

        Returns:
            Remaining seconds if locked out, None otherwise
        """
        client = await self._get_redis_client()
        lockout_key = self._get_lockout_key(username)

        lockout_data = await client.get(lockout_key)

        if lockout_data:
            try:
                lockout_info = json.loads(lockout_data)
                lockout_until = datetime.fromisoformat(lockout_info["locked_until"])
                now = datetime.utcnow()

                if now < lockout_until:
                    remaining = (lockout_until - now).total_seconds()
                    return int(remaining)
            except (json.JSONDecodeError, KeyError, ValueError):
                pass

        return None

    async def record_failed_attempt(self, username: str) -> Dict:
        """
        Record a failed login attempt and apply lockout if threshold exceeded.

        Args:
            username: Username that failed authentication

        Returns:
            Dictionary with lockout status and details

        Raises:
            HTTPException: If account is locked out (429 Too Many Requests)
        """
        client = await self._get_redis_client()
        attempts_key = self._get_failed_attempts_key(username)
        lockout_key = self._get_lockout_key(username)

        # Check if already locked out
        if await self.is_locked_out(username):
            remaining_time = await self.get_lockout_remaining_time(username)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "account_locked",
                    "message": f"Account locked due to too many failed login attempts. Try again in {remaining_time} seconds.",
                    "locked_until_seconds": remaining_time,
                    "locked_until_minutes": round(remaining_time / 60, 1)
                }
            )

        # Increment failed attempts counter
        attempts = await client.incr(attempts_key)

        # Set expiry on first attempt (sliding window)
        if attempts == 1:
            await client.expire(attempts_key, self.attempt_window_minutes * 60)

        # Check if lockout threshold exceeded
        if attempts >= self.max_failed_attempts:
            # Lock the account
            lockout_until = datetime.utcnow() + timedelta(minutes=self.lockout_duration_minutes)
            lockout_data = {
                "locked_until": lockout_until.isoformat(),
                "failed_attempts": attempts,
                "locked_at": datetime.utcnow().isoformat()
            }

            await client.setex(
                lockout_key,
                self.lockout_duration_minutes * 60,
                json.dumps(lockout_data)
            )

            # Reset failed attempts counter
            await client.delete(attempts_key)

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "account_locked",
                    "message": f"Account locked due to {self.max_failed_attempts} failed login attempts. Try again in {self.lockout_duration_minutes} minutes.",
                    "locked_until_seconds": self.lockout_duration_minutes * 60,
                    "locked_until_minutes": self.lockout_duration_minutes
                }
            )

        # Return current attempt count
        return {
            "locked": False,
            "failed_attempts": attempts,
            "max_attempts": self.max_failed_attempts,
            "remaining_attempts": self.max_failed_attempts - attempts,
            "window_minutes": self.attempt_window_minutes
        }

    async def reset_failed_attempts(self, username: str) -> None:
        """
        Reset failed login attempts counter (called on successful login).

        Args:
            username: Username to reset
        """
        client = await self._get_redis_client()
        attempts_key = self._get_failed_attempts_key(username)
        lockout_key = self._get_lockout_key(username)

        # Delete both keys
        await client.delete(attempts_key)
        await client.delete(lockout_key)

    async def get_failed_attempts_count(self, username: str) -> int:
        """
        Get the current count of failed login attempts.

        Args:
            username: Username to check

        Returns:
            Number of failed attempts in current window
        """
        client = await self._get_redis_client()
        attempts_key = self._get_failed_attempts_key(username)

        attempts = await client.get(attempts_key)
        return int(attempts) if attempts else 0

    async def unlock_account(self, username: str) -> None:
        """
        Manually unlock an account (admin function).

        Args:
            username: Username to unlock
        """
        await self.reset_failed_attempts(username)

    async def get_lockout_info(self, username: str) -> Dict:
        """
        Get detailed lockout information for an account.

        Args:
            username: Username to check

        Returns:
            Dictionary with lockout status and details
        """
        is_locked = await self.is_locked_out(username)
        failed_attempts = await self.get_failed_attempts_count(username)
        remaining_time = await self.get_lockout_remaining_time(username)

        return {
            "username": username,
            "is_locked": is_locked,
            "failed_attempts": failed_attempts,
            "max_attempts": self.max_failed_attempts,
            "remaining_time_seconds": remaining_time,
            "lockout_duration_minutes": self.lockout_duration_minutes,
            "attempt_window_minutes": self.attempt_window_minutes
        }


# Global instance (will be initialized with Redis client in main.py)
_lockout_manager: Optional[AccountLockoutManager] = None


def get_lockout_manager(redis_client: Optional[redis.Redis] = None) -> AccountLockoutManager:
    """
    Get or create the global account lockout manager instance.

    Args:
        redis_client: Optional Redis client instance

    Returns:
        AccountLockoutManager instance
    """
    global _lockout_manager
    if _lockout_manager is None:
        _lockout_manager = AccountLockoutManager(redis_client)
    return _lockout_manager
