#!/usr/bin/env python3
"""
FarmaDisplay - First Boot Setup Script
Handles initial device configuration on first boot via Bluetooth

This script:
1. Checks if device is already configured
2. Activates Bluetooth and makes it discoverable
3. Starts Bluetooth configuration server
4. Receives configuration JSON from smartphone
5. Marks device as configured
"""

import os
import sys
import json
import logging
import subprocess
import time
from pathlib import Path

# Configuration paths
TURNOTEC_DIR = Path("/home/pi/.turnotec")
CONFIG_FILE = TURNOTEC_DIR / "config.json"
CONFIGURED_FLAG = TURNOTEC_DIR / "configured"
LOG_FILE = "/var/log/farmadisplay-bootstrap.log"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


def is_configured():
    """Check if device has already been configured."""
    return CONFIGURED_FLAG.exists()


def create_turnotec_dir():
    """Create .turnotec directory if it doesn't exist."""
    try:
        TURNOTEC_DIR.mkdir(parents=True, exist_ok=True)
        logger.info(f"✓ Created directory: {TURNOTEC_DIR}")
        return True
    except Exception as e:
        logger.error(f"✗ Failed to create directory: {e}")
        return False


def enable_bluetooth():
    """Enable and configure Bluetooth to be discoverable."""
    try:
        logger.info("Enabling Bluetooth...")

        # Power on Bluetooth
        subprocess.run(['hciconfig', 'hci0', 'up'], check=True)
        logger.info("✓ Bluetooth powered on")

        # Make discoverable and pairable
        subprocess.run(['hciconfig', 'hci0', 'piscan'], check=True)
        logger.info("✓ Bluetooth set to discoverable mode")

        # Set device name
        subprocess.run(
            ['hciconfig', 'hci0', 'name', 'FarmaDisplay Setup'],
            check=True
        )
        logger.info("✓ Bluetooth name set to 'FarmaDisplay Setup'")

        return True

    except subprocess.CalledProcessError as e:
        logger.error(f"✗ Failed to configure Bluetooth: {e}")
        return False
    except FileNotFoundError:
        logger.error("✗ hciconfig command not found. Is Bluetooth installed?")
        return False


def disable_bluetooth_discoverable():
    """Disable Bluetooth discoverability after configuration."""
    try:
        subprocess.run(['hciconfig', 'hci0', 'noscan'], check=False)
        logger.info("✓ Bluetooth discoverability disabled")
    except Exception as e:
        logger.warning(f"Could not disable Bluetooth discoverability: {e}")


def start_bt_config_server():
    """Start the Bluetooth configuration receiver server."""
    try:
        logger.info("Starting Bluetooth configuration server...")

        # Path to the BT config receiver script
        bt_script = Path(__file__).parent / "bt_config_receiver.py"

        if not bt_script.exists():
            logger.error(f"✗ Bluetooth config script not found: {bt_script}")
            return False

        # Execute the BT config receiver (it will handle the configuration)
        result = subprocess.run(
            ['python3', str(bt_script)],
            check=True
        )

        logger.info("✓ Bluetooth configuration completed")
        return True

    except subprocess.CalledProcessError as e:
        logger.error(f"✗ Bluetooth configuration failed: {e}")
        return False
    except Exception as e:
        logger.error(f"✗ Unexpected error: {e}")
        return False


def mark_as_configured():
    """Create flag file to indicate device is configured."""
    try:
        CONFIGURED_FLAG.touch()
        logger.info(f"✓ Created configuration flag: {CONFIGURED_FLAG}")
        return True
    except Exception as e:
        logger.error(f"✗ Failed to create configuration flag: {e}")
        return False


def disable_bootstrap_service():
    """Disable the bootstrap service so it doesn't run on next boot."""
    try:
        logger.info("Disabling bootstrap service...")
        subprocess.run(
            ['systemctl', 'disable', 'farmadisplay-bootstrap.service'],
            check=True
        )
        logger.info("✓ Bootstrap service disabled")
        return True
    except Exception as e:
        logger.warning(f"Could not disable bootstrap service: {e}")
        return False


def main():
    """Main bootstrap process."""
    logger.info("=" * 60)
    logger.info("FarmaDisplay - First Boot Setup")
    logger.info("=" * 60)

    # Check if already configured
    if is_configured():
        logger.info("✓ Device is already configured. Exiting.")
        sys.exit(0)

    logger.info("⚙️  Starting first boot configuration...")

    # Create directory structure
    if not create_turnotec_dir():
        logger.error("Failed to create directory structure. Exiting.")
        sys.exit(1)

    # Enable Bluetooth
    if not enable_bluetooth():
        logger.error("Failed to enable Bluetooth. Exiting.")
        sys.exit(1)

    logger.info("")
    logger.info("=" * 60)
    logger.info("📱 READY FOR CONFIGURATION")
    logger.info("=" * 60)
    logger.info("")
    logger.info("Device is now discoverable as: 'FarmaDisplay Setup'")
    logger.info("Please use the FarmaDisplay mobile app to send configuration.")
    logger.info("")
    logger.info("Waiting for configuration from smartphone...")
    logger.info("")

    # Start Bluetooth configuration server (blocking call)
    if start_bt_config_server():
        logger.info("")
        logger.info("=" * 60)
        logger.info("✅ CONFIGURATION SUCCESSFUL")
        logger.info("=" * 60)
        logger.info("")

        # Mark as configured
        mark_as_configured()

        # Disable Bluetooth discoverability
        disable_bluetooth_discoverable()

        # Disable bootstrap service
        disable_bootstrap_service()

        logger.info("Device will reboot in 5 seconds...")
        time.sleep(5)

        # Reboot to apply configuration
        logger.info("Rebooting...")
        subprocess.run(['reboot'], check=False)

    else:
        logger.error("")
        logger.error("=" * 60)
        logger.error("❌ CONFIGURATION FAILED")
        logger.error("=" * 60)
        logger.error("")
        logger.error("Please check the logs and try again.")
        logger.error("To retry: sudo rm /home/pi/.turnotec/configured")
        logger.error("Then reboot the device.")
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("\nSetup interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        sys.exit(1)
