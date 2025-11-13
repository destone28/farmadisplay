"""
Security Logging System
Implements comprehensive security event logging with structured JSON format
"""
import json
import logging
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class SecurityEventType(str, Enum):
    """Security event types for categorization and filtering."""

    # Authentication events
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILURE = "login_failure"
    LOGOUT = "logout"
    PASSWORD_CHANGE = "password_change"
    ACCOUNT_LOCKED = "account_locked"

    # Authorization events
    ACCESS_DENIED = "access_denied"
    PERMISSION_DENIED = "permission_denied"
    UNAUTHORIZED_ACCESS_ATTEMPT = "unauthorized_access_attempt"

    # Admin actions
    USER_CREATED = "user_created"
    USER_MODIFIED = "user_modified"
    USER_DELETED = "user_deleted"
    ROLE_CHANGED = "role_changed"
    PHARMACY_CREATED = "pharmacy_created"
    PHARMACY_MODIFIED = "pharmacy_modified"
    PHARMACY_DELETED = "pharmacy_deleted"
    DEVICE_REGISTERED = "device_registered"
    DEVICE_DEACTIVATED = "device_deactivated"

    # Security incidents
    BRUTE_FORCE_DETECTED = "brute_force_detected"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    SQL_INJECTION_ATTEMPT = "sql_injection_attempt"
    XSS_ATTEMPT = "xss_attempt"

    # System events
    CONFIG_CHANGED = "config_changed"
    BACKUP_CREATED = "backup_created"
    BACKUP_RESTORED = "backup_restored"


class SecurityEventLevel(str, Enum):
    """Security event severity levels."""

    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class SecurityEvent(BaseModel):
    """
    Structured security event model for consistent logging.

    All security-related events should be logged using this model
    to ensure consistent format and easy analysis.
    """

    timestamp: datetime = Field(default_factory=datetime.utcnow)
    event_type: SecurityEventType
    level: SecurityEventLevel
    username: Optional[str] = None
    user_id: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    resource: Optional[str] = None
    action: Optional[str] = None
    result: Optional[str] = None
    message: str
    details: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None

    class Config:
        use_enum_values = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    def to_json(self) -> str:
        """
        Convert event to JSON string for logging.

        Returns:
            JSON string representation
        """
        return self.model_dump_json(exclude_none=True)

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert event to dictionary.

        Returns:
            Dictionary representation
        """
        return self.model_dump(exclude_none=True)


class SecurityLogger:
    """
    Security logger with structured JSON logging and file rotation.

    Provides methods for logging various security events with
    consistent format and automatic categorization.
    """

    def __init__(self, log_file_path: str = "/var/log/turnotec/security.log"):
        """
        Initialize the security logger.

        Args:
            log_file_path: Path to the security log file
        """
        self.log_file_path = log_file_path

        # Create log directory if it doesn't exist
        log_dir = Path(log_file_path).parent
        log_dir.mkdir(parents=True, exist_ok=True)

        # Configure logger
        self.logger = logging.getLogger("security")
        self.logger.setLevel(logging.INFO)

        # Remove existing handlers to avoid duplicates
        self.logger.handlers.clear()

        # File handler with JSON formatter
        file_handler = logging.FileHandler(log_file_path, encoding="utf-8")
        file_handler.setLevel(logging.INFO)

        # JSON formatter
        formatter = logging.Formatter(
            '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "event": %(message)s}',
            datefmt="%Y-%m-%dT%H:%M:%S"
        )
        file_handler.setFormatter(formatter)

        self.logger.addHandler(file_handler)

        # Also add console handler for development
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.WARNING)
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)

    def log_event(self, event: SecurityEvent) -> None:
        """
        Log a security event.

        Args:
            event: SecurityEvent instance to log
        """
        # Map event level to logging level
        level_map = {
            SecurityEventLevel.INFO: logging.INFO,
            SecurityEventLevel.WARNING: logging.WARNING,
            SecurityEventLevel.ERROR: logging.ERROR,
            SecurityEventLevel.CRITICAL: logging.CRITICAL,
        }

        log_level = level_map.get(event.level, logging.INFO)

        # Log as JSON
        self.logger.log(log_level, event.to_json())

    def log_authentication(
        self,
        event_type: SecurityEventType,
        username: str,
        success: bool,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Log an authentication event.

        Args:
            event_type: Type of authentication event
            username: Username attempting authentication
            success: Whether authentication succeeded
            ip_address: Client IP address
            user_agent: Client user agent
            details: Additional details
        """
        level = SecurityEventLevel.INFO if success else SecurityEventLevel.WARNING

        event = SecurityEvent(
            event_type=event_type,
            level=level,
            username=username,
            ip_address=ip_address,
            user_agent=user_agent,
            result="success" if success else "failure",
            message=f"Authentication {'successful' if success else 'failed'} for user {username}",
            details=details
        )

        self.log_event(event)

    def log_authorization_failure(
        self,
        username: str,
        user_id: Optional[int],
        resource: str,
        action: str,
        ip_address: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Log an authorization failure.

        Args:
            username: Username attempting access
            user_id: User ID
            resource: Resource being accessed
            action: Action being attempted
            ip_address: Client IP address
            details: Additional details
        """
        event = SecurityEvent(
            event_type=SecurityEventType.ACCESS_DENIED,
            level=SecurityEventLevel.WARNING,
            username=username,
            user_id=user_id,
            ip_address=ip_address,
            resource=resource,
            action=action,
            result="denied",
            message=f"Access denied: {username} attempted {action} on {resource}",
            details=details
        )

        self.log_event(event)

    def log_admin_action(
        self,
        event_type: SecurityEventType,
        username: str,
        user_id: int,
        resource: str,
        action: str,
        ip_address: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Log an administrative action.

        Args:
            event_type: Type of admin action
            username: Admin username
            user_id: Admin user ID
            resource: Resource being modified
            action: Action performed
            ip_address: Client IP address
            details: Additional details (e.g., changed fields)
        """
        event = SecurityEvent(
            event_type=event_type,
            level=SecurityEventLevel.INFO,
            username=username,
            user_id=user_id,
            ip_address=ip_address,
            resource=resource,
            action=action,
            result="success",
            message=f"Admin action: {username} {action} {resource}",
            details=details
        )

        self.log_event(event)

    def log_security_incident(
        self,
        event_type: SecurityEventType,
        severity: SecurityEventLevel,
        message: str,
        ip_address: Optional[str] = None,
        username: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Log a security incident.

        Args:
            event_type: Type of security incident
            severity: Severity level
            message: Incident description
            ip_address: Client IP address
            username: Associated username (if any)
            details: Additional incident details
        """
        event = SecurityEvent(
            event_type=event_type,
            level=severity,
            username=username,
            ip_address=ip_address,
            message=message,
            details=details
        )

        self.log_event(event)


# Global security logger instance
_security_logger: Optional[SecurityLogger] = None


def get_security_logger(log_file_path: str = "/var/log/turnotec/security.log") -> SecurityLogger:
    """
    Get or create the global security logger instance.

    Args:
        log_file_path: Path to the security log file

    Returns:
        SecurityLogger instance
    """
    global _security_logger
    if _security_logger is None:
        _security_logger = SecurityLogger(log_file_path)
    return _security_logger


# Convenience functions for common security events

def log_login_success(
    username: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> None:
    """Log successful login."""
    logger = get_security_logger()
    logger.log_authentication(
        event_type=SecurityEventType.LOGIN_SUCCESS,
        username=username,
        success=True,
        ip_address=ip_address,
        user_agent=user_agent
    )


def log_login_failure(
    username: str,
    reason: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> None:
    """Log failed login attempt."""
    logger = get_security_logger()
    logger.log_authentication(
        event_type=SecurityEventType.LOGIN_FAILURE,
        username=username,
        success=False,
        ip_address=ip_address,
        user_agent=user_agent,
        details={"reason": reason}
    )


def log_account_locked(
    username: str,
    failed_attempts: int,
    ip_address: Optional[str] = None
) -> None:
    """Log account lockout due to failed attempts."""
    logger = get_security_logger()
    logger.log_security_incident(
        event_type=SecurityEventType.ACCOUNT_LOCKED,
        severity=SecurityEventLevel.WARNING,
        message=f"Account {username} locked after {failed_attempts} failed login attempts",
        username=username,
        ip_address=ip_address,
        details={"failed_attempts": failed_attempts}
    )


def log_brute_force_detected(
    username: str,
    ip_address: str,
    attempts: int
) -> None:
    """Log detected brute force attack."""
    logger = get_security_logger()
    logger.log_security_incident(
        event_type=SecurityEventType.BRUTE_FORCE_DETECTED,
        severity=SecurityEventLevel.CRITICAL,
        message=f"Brute force attack detected: {attempts} attempts on {username} from {ip_address}",
        username=username,
        ip_address=ip_address,
        details={"attempts": attempts}
    )


def log_rate_limit_exceeded(
    ip_address: str,
    endpoint: str,
    requests: int
) -> None:
    """Log rate limit exceeded."""
    logger = get_security_logger()
    logger.log_security_incident(
        event_type=SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity=SecurityEventLevel.WARNING,
        message=f"Rate limit exceeded: {requests} requests to {endpoint} from {ip_address}",
        ip_address=ip_address,
        details={"endpoint": endpoint, "requests": requests}
    )


def log_unauthorized_access(
    username: str,
    resource: str,
    action: str,
    ip_address: Optional[str] = None
) -> None:
    """Log unauthorized access attempt."""
    logger = get_security_logger()
    logger.log_authorization_failure(
        username=username,
        user_id=None,
        resource=resource,
        action=action,
        ip_address=ip_address
    )
