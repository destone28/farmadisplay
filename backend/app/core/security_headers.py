"""
Security Headers Middleware
Implements OWASP-recommended security headers for all HTTP responses
"""
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds security headers to all HTTP responses.

    Implements OWASP security best practices including:
    - XSS protection
    - Clickjacking prevention
    - MIME type sniffing prevention
    - Content Security Policy
    - HTTPS enforcement
    - Information disclosure prevention
    """

    def __init__(self, app: ASGIApp):
        """
        Initialize the security headers middleware.

        Args:
            app: The ASGI application instance
        """
        super().__init__(app)

        # Define all security headers
        self.security_headers = {
            # Prevent MIME type sniffing
            "X-Content-Type-Options": "nosniff",

            # Prevent clickjacking attacks
            "X-Frame-Options": "DENY",

            # Enforce HTTPS for 1 year including subdomains
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",

            # Content Security Policy - allows self-hosted content and necessary CDNs
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' wss: https:; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            ),

            # Referrer policy - balance between privacy and functionality
            "Referrer-Policy": "strict-origin-when-cross-origin",

            # XSS protection (legacy but still useful)
            "X-XSS-Protection": "1; mode=block",

            # Permissions Policy - restrict access to browser features
            "Permissions-Policy": (
                "geolocation=(), "
                "microphone=(), "
                "camera=(), "
                "payment=(), "
                "usb=(), "
                "magnetometer=()"
            ),
        }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process the request and add security headers to the response.

        Args:
            request: The incoming HTTP request
            call_next: The next middleware or route handler

        Returns:
            Response with security headers added
        """
        # Process the request
        response = await call_next(request)

        # Add all security headers
        for header, value in self.security_headers.items():
            response.headers[header] = value

        # Remove server information disclosure
        if "Server" in response.headers:
            del response.headers["Server"]

        # Remove X-Powered-By if present (some ASGI servers add this)
        if "X-Powered-By" in response.headers:
            del response.headers["X-Powered-By"]

        return response


def get_security_headers() -> dict:
    """
    Get the security headers configuration.

    Returns:
        Dictionary of security headers and their values
    """
    return {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
        "Content-Security-Policy": (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' wss: https:; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        ),
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "X-XSS-Protection": "1; mode=block",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=()",
    }


def validate_security_headers(response_headers: dict) -> bool:
    """
    Validate that all required security headers are present.

    Args:
        response_headers: Dictionary of response headers to validate

    Returns:
        True if all required headers are present, False otherwise
    """
    required_headers = [
        "X-Content-Type-Options",
        "X-Frame-Options",
        "Strict-Transport-Security",
        "Content-Security-Policy",
        "Referrer-Policy",
        "X-XSS-Protection",
        "Permissions-Policy",
    ]

    return all(header in response_headers for header in required_headers)
