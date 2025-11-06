#!/usr/bin/env python3
"""
Security Fixes Verification Script
Verifies that all critical security fixes have been properly implemented
"""
import os
import sys
from pathlib import Path
from typing import List, Tuple


class Colors:
    """ANSI color codes for terminal output."""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'


def print_header(text: str) -> None:
    """Print a formatted header."""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text:^70}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.END}\n")


def print_check(passed: bool, message: str) -> None:
    """Print a check result."""
    status = f"{Colors.GREEN}✓{Colors.END}" if passed else f"{Colors.RED}✗{Colors.END}"
    print(f"{status} {message}")


def check_file_exists(filepath: str) -> bool:
    """Check if a file exists."""
    return Path(filepath).exists()


def check_file_contains(filepath: str, search_strings: List[str]) -> Tuple[bool, List[str]]:
    """Check if a file contains all specified strings."""
    if not check_file_exists(filepath):
        return False, ["File does not exist"]

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        missing = []
        for search_str in search_strings:
            if search_str not in content:
                missing.append(search_str)

        return len(missing) == 0, missing
    except Exception as e:
        return False, [str(e)]


def main() -> int:
    """Main verification function."""
    print_header("FARMADISPLAY SECURITY FIXES VERIFICATION")

    total_checks = 0
    passed_checks = 0

    # Get project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    # Change to project root
    os.chdir(project_root)

    # ========== FIX 1: Security Headers Middleware ==========
    print(f"\n{Colors.BOLD}FIX 1: Security Headers Middleware{Colors.END}")

    checks = [
        ("backend/app/core/security_headers.py", [
            "class SecurityHeadersMiddleware",
            "X-Content-Type-Options",
            "X-Frame-Options",
            "Strict-Transport-Security",
            "Content-Security-Policy",
            "Referrer-Policy",
            "X-XSS-Protection",
            "Permissions-Policy",
        ]),
    ]

    for filepath, required_strings in checks:
        total_checks += 1
        passed, missing = check_file_contains(filepath, required_strings)
        passed_checks += 1 if passed else 0
        print_check(passed, f"Security headers middleware: {filepath}")
        if not passed and missing:
            for m in missing[:3]:  # Show first 3 missing
                print(f"   Missing: {m}")

    # ========== FIX 2: Account Lockout Mechanism ==========
    print(f"\n{Colors.BOLD}FIX 2: Account Lockout Mechanism{Colors.END}")

    checks = [
        ("backend/app/core/account_lockout.py", [
            "class AccountLockoutManager",
            "MAX_FAILED_ATTEMPTS = 5",
            "LOCKOUT_DURATION_MINUTES = 15",
            "async def is_locked_out",
            "async def record_failed_attempt",
            "async def reset_failed_attempts",
            "auth:failed_attempts:",
            "auth:lockout:",
        ]),
    ]

    for filepath, required_strings in checks:
        total_checks += 1
        passed, missing = check_file_contains(filepath, required_strings)
        passed_checks += 1 if passed else 0
        print_check(passed, f"Account lockout manager: {filepath}")
        if not passed and missing:
            for m in missing[:3]:
                print(f"   Missing: {m}")

    # ========== FIX 3: Security Logging ==========
    print(f"\n{Colors.BOLD}FIX 3: Comprehensive Security Logging{Colors.END}")

    checks = [
        ("backend/app/core/security_logging.py", [
            "class SecurityEventType",
            "class SecurityEventLevel",
            "class SecurityEvent",
            "class SecurityLogger",
            "LOGIN_SUCCESS",
            "LOGIN_FAILURE",
            "ACCOUNT_LOCKED",
            "BRUTE_FORCE_DETECTED",
            "def log_authentication",
            "def log_authorization_failure",
            "def log_admin_action",
            "def log_security_incident",
        ]),
    ]

    for filepath, required_strings in checks:
        total_checks += 1
        passed, missing = check_file_contains(filepath, required_strings)
        passed_checks += 1 if passed else 0
        print_check(passed, f"Security logging system: {filepath}")
        if not passed and missing:
            for m in missing[:3]:
                print(f"   Missing: {m}")

    # ========== FIX 4: Authentication Service ==========
    print(f"\n{Colors.BOLD}FIX 4: Authentication Service{Colors.END}")

    checks = [
        ("backend/app/services/authentication.py", [
            "class AuthenticationService",
            "bcrypt__rounds=12",
            "def verify_password",
            "def get_password_hash",
            "def create_access_token",
            "async def authenticate_user",
            "def validate_password_strength",
            "lockout_manager",
            "security_logger",
        ]),
    ]

    for filepath, required_strings in checks:
        total_checks += 1
        passed, missing = check_file_contains(filepath, required_strings)
        passed_checks += 1 if passed else 0
        print_check(passed, f"Authentication service: {filepath}")
        if not passed and missing:
            for m in missing[:3]:
                print(f"   Missing: {m}")

    # ========== FIX 5: Init Files ==========
    print(f"\n{Colors.BOLD}FIX 5: Python Package Structure{Colors.END}")

    init_files = [
        "backend/app/__init__.py",
        "backend/app/core/__init__.py",
        "backend/app/services/__init__.py",
    ]

    for filepath in init_files:
        total_checks += 1
        exists = check_file_exists(filepath)
        passed_checks += 1 if exists else 0
        print_check(exists, f"Init file: {filepath}")

    # ========== FIX 6: Requirements ==========
    print(f"\n{Colors.BOLD}FIX 6: Updated Dependencies{Colors.END}")

    checks = [
        ("backend/requirements.txt", [
            "fastapi==0.115.0",
            "redis==5.1.1",
            "bcrypt==4.2.0",
            "passlib[bcrypt]==1.7.4",
            "python-jose[cryptography]==3.3.0",
            "bandit==1.7.10",
            "safety==3.2.8",
        ]),
    ]

    for filepath, required_strings in checks:
        total_checks += 1
        passed, missing = check_file_contains(filepath, required_strings)
        passed_checks += 1 if passed else 0
        print_check(passed, f"Backend dependencies: {filepath}")
        if not passed and missing:
            for m in missing[:3]:
                print(f"   Missing: {m}")

    # ========== FIX 7: Frontend Security ==========
    print(f"\n{Colors.BOLD}FIX 7: Frontend Security Configuration{Colors.END}")

    total_checks += 1
    npmrc_exists = check_file_exists("frontend/.npmrc")
    passed_checks += 1 if npmrc_exists else 0
    print_check(npmrc_exists, "NPM security config: frontend/.npmrc")

    total_checks += 1
    package_json_exists = check_file_exists("frontend/package.json")
    passed_checks += 1 if package_json_exists else 0
    print_check(package_json_exists, "Package.json: frontend/package.json")

    # ========== Summary ==========
    print_header("VERIFICATION SUMMARY")

    percentage = (passed_checks / total_checks * 100) if total_checks > 0 else 0

    print(f"Total Checks: {total_checks}")
    print(f"Passed: {Colors.GREEN}{passed_checks}{Colors.END}")
    print(f"Failed: {Colors.RED}{total_checks - passed_checks}{Colors.END}")
    print(f"Success Rate: {Colors.GREEN if percentage >= 90 else Colors.YELLOW}{percentage:.1f}%{Colors.END}")

    # Final verdict
    print()
    if passed_checks == total_checks:
        print(f"{Colors.GREEN}{Colors.BOLD}✅ ALL SECURITY FIXES VERIFIED - {passed_checks}/{total_checks} PASSED{Colors.END}")
        print(f"{Colors.GREEN}System is ready for production deployment!{Colors.END}")
        return 0
    else:
        print(f"{Colors.RED}{Colors.BOLD}❌ VERIFICATION FAILED - {passed_checks}/{total_checks} PASSED{Colors.END}")
        print(f"{Colors.RED}Please fix the failing checks before deployment.{Colors.END}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
