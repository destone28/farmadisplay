#!/usr/bin/env python3
"""
TurnoTec - WiFi PSK Hash Generator
Generates WPA2-PSK hash from SSID and password to handle special characters correctly.
"""

import sys
import hashlib
import binascii

def generate_psk(ssid, password):
    """
    Generate WPA2-PSK hash using PBKDF2-HMAC-SHA1.

    Args:
        ssid: WiFi network SSID (plaintext)
        password: WiFi password (plaintext)

    Returns:
        64-character hexadecimal PSK hash
    """
    # WPA2 uses PBKDF2 with HMAC-SHA1, 4096 iterations, 32 bytes output
    psk = hashlib.pbkdf2_hmac(
        'sha1',                      # Hash algorithm
        password.encode('utf-8'),    # Password as bytes
        ssid.encode('utf-8'),        # SSID as salt
        4096,                        # Iterations
        32                           # Output length (256 bits = 32 bytes)
    )

    # Convert to hexadecimal string
    return binascii.hexlify(psk).decode('ascii')

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: generate_psk.py <SSID> <PASSWORD>", file=sys.stderr)
        sys.exit(1)

    ssid = sys.argv[1]
    password = sys.argv[2]

    # Validate inputs
    if not ssid or len(ssid) > 32:
        print("ERROR: SSID must be 1-32 characters", file=sys.stderr)
        sys.exit(1)

    if not password or len(password) < 8 or len(password) > 63:
        print("ERROR: Password must be 8-63 characters", file=sys.stderr)
        sys.exit(1)

    # Generate and print PSK hash
    try:
        psk_hash = generate_psk(ssid, password)
        print(psk_hash)
        sys.exit(0)
    except Exception as e:
        print(f"ERROR: Failed to generate PSK hash: {e}", file=sys.stderr)
        sys.exit(1)
