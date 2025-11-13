#!/usr/bin/env python3
"""
FarmaDisplay - FullPageOS Configuration Script
Applies WiFi and URL configuration to FullPageOS system

This script:
1. Reads configuration from JSON file
2. Configures WiFi (wpa_supplicant)
3. Updates FullPageOS URL in /boot/firmware/fullpageos.txt
4. Tests WiFi connectivity
"""

import os
import sys
import json
import logging
import subprocess
import time
from pathlib import Path
from datetime import datetime

# Configuration paths
FULLPAGEOS_CONFIG = Path("/boot/firmware/fullpageos.txt")
FULLPAGEOS_CONFIG_ALT = Path("/boot/fullpageos.txt")  # Alternative location
WPA_SUPPLICANT_CONF = Path("/etc/wpa_supplicant/wpa_supplicant.conf")
LOG_FILE = "/var/log/farmadisplay-config.log"

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


def load_config(config_file):
    """
    Load configuration from JSON file.

    Args:
        config_file: Path to configuration JSON file

    Returns:
        dict: Configuration data or None if failed
    """
    try:
        with open(config_file, 'r') as f:
            config = json.load(f)
        logger.info(f"✓ Configuration loaded from {config_file}")
        return config
    except FileNotFoundError:
        logger.error(f"✗ Configuration file not found: {config_file}")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"✗ Invalid JSON in configuration file: {e}")
        return None
    except Exception as e:
        logger.error(f"✗ Failed to load configuration: {e}")
        return None


def configure_wifi(ssid, password):
    """
    Configure WiFi using wpa_supplicant.

    Args:
        ssid: WiFi SSID
        password: WiFi password

    Returns:
        bool: True if successful
    """
    try:
        logger.info(f"Configuring WiFi for SSID: {ssid}")

        # Create wpa_supplicant configuration
        config = f"""country=IT
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={{
    ssid="{ssid}"
    psk="{password}"
    key_mgmt=WPA-PSK
    priority=10
}}
"""

        # Backup existing configuration
        if WPA_SUPPLICANT_CONF.exists():
            backup_path = WPA_SUPPLICANT_CONF.with_suffix('.conf.backup')
            subprocess.run(
                ['cp', str(WPA_SUPPLICANT_CONF), str(backup_path)],
                check=False
            )
            logger.info(f"✓ Backed up existing wpa_supplicant.conf to {backup_path}")

        # Write new configuration
        with open(WPA_SUPPLICANT_CONF, 'w') as f:
            f.write(config)

        # Set proper permissions
        WPA_SUPPLICANT_CONF.chmod(0o600)

        logger.info(f"✓ WiFi configuration written to {WPA_SUPPLICANT_CONF}")

        # Reconfigure wpa_supplicant
        try:
            subprocess.run(['wpa_cli', '-i', 'wlan0', 'reconfigure'], check=True)
            logger.info("✓ wpa_supplicant reconfigured")
        except subprocess.CalledProcessError:
            logger.warning("wpa_cli reconfigure failed, trying alternative method...")
            try:
                subprocess.run(['systemctl', 'restart', 'wpa_supplicant'], check=False)
                logger.info("✓ wpa_supplicant service restarted")
            except:
                pass

        # Wait a moment for connection
        logger.info("Waiting for WiFi connection...")
        time.sleep(5)

        return True

    except Exception as e:
        logger.error(f"✗ Failed to configure WiFi: {e}")
        return False


def test_wifi_connectivity(max_attempts=3, delay=5):
    """
    Test WiFi connectivity by checking interface status and pinging gateway.

    Args:
        max_attempts: Maximum number of test attempts
        delay: Delay between attempts in seconds

    Returns:
        bool: True if connection is working
    """
    logger.info("Testing WiFi connectivity...")

    for attempt in range(1, max_attempts + 1):
        try:
            # Check if wlan0 has an IP address
            result = subprocess.run(
                ['ip', 'addr', 'show', 'wlan0'],
                capture_output=True,
                text=True,
                check=True
            )

            if 'inet ' in result.stdout:
                logger.info("✓ wlan0 has an IP address")

                # Try to ping default gateway
                try:
                    subprocess.run(
                        ['ping', '-c', '1', '-W', '2', '8.8.8.8'],
                        check=True,
                        capture_output=True
                    )
                    logger.info("✓ WiFi connectivity test successful")
                    return True
                except subprocess.CalledProcessError:
                    logger.warning(f"Attempt {attempt}/{max_attempts}: Cannot reach internet")

            else:
                logger.warning(f"Attempt {attempt}/{max_attempts}: No IP address on wlan0")

        except Exception as e:
            logger.warning(f"Attempt {attempt}/{max_attempts}: {e}")

        if attempt < max_attempts:
            logger.info(f"Waiting {delay} seconds before retry...")
            time.sleep(delay)

    logger.warning("⚠ WiFi connectivity test failed (will continue anyway)")
    return False


def find_fullpageos_config():
    """
    Find the FullPageOS configuration file.

    Returns:
        Path: Path to fullpageos.txt or None if not found
    """
    # Try primary location
    if FULLPAGEOS_CONFIG.exists():
        return FULLPAGEOS_CONFIG

    # Try alternative location
    if FULLPAGEOS_CONFIG_ALT.exists():
        return FULLPAGEOS_CONFIG_ALT

    # Try to find it
    try:
        result = subprocess.run(
            ['find', '/boot', '-name', 'fullpageos.txt'],
            capture_output=True,
            text=True,
            check=False
        )
        if result.stdout.strip():
            path = Path(result.stdout.strip().split('\n')[0])
            if path.exists():
                logger.info(f"Found fullpageos.txt at: {path}")
                return path
    except:
        pass

    return None


def update_fullpageos_url(display_url):
    """
    Update the display URL in FullPageOS configuration.

    Args:
        display_url: URL to display

    Returns:
        bool: True if successful
    """
    try:
        logger.info(f"Updating FullPageOS URL to: {display_url}")

        # Find config file
        config_path = find_fullpageos_config()

        if not config_path:
            logger.error("✗ FullPageOS configuration file not found")
            logger.error("Searched in:")
            logger.error(f"  - {FULLPAGEOS_CONFIG}")
            logger.error(f"  - {FULLPAGEOS_CONFIG_ALT}")
            return False

        logger.info(f"Found FullPageOS config at: {config_path}")

        # Read existing configuration
        with open(config_path, 'r') as f:
            lines = f.readlines()

        # Backup original file
        backup_path = config_path.with_suffix('.txt.backup')
        with open(backup_path, 'w') as f:
            f.writelines(lines)
        logger.info(f"✓ Backed up original config to {backup_path}")

        # Update URL line
        url_updated = False
        new_lines = []

        for line in lines:
            if line.strip().startswith('FULLPAGEOS_URL='):
                new_lines.append(f'FULLPAGEOS_URL={display_url}\n')
                url_updated = True
                logger.info(f"✓ Updated URL line: FULLPAGEOS_URL={display_url}")
            else:
                new_lines.append(line)

        # If URL line doesn't exist, add it
        if not url_updated:
            new_lines.append(f'\n# FarmaDisplay URL\nFULLPAGEOS_URL={display_url}\n')
            logger.info(f"✓ Added URL line: FULLPAGEOS_URL={display_url}")

        # Remount /boot as read-write if needed
        try:
            subprocess.run(['mount', '-o', 'remount,rw', '/boot'], check=False)
            subprocess.run(['mount', '-o', 'remount,rw', '/boot/firmware'], check=False)
        except:
            pass

        # Write updated configuration
        with open(config_path, 'w') as f:
            f.writelines(new_lines)

        logger.info(f"✓ FullPageOS configuration updated at {config_path}")

        # Remount /boot as read-only
        try:
            subprocess.run(['mount', '-o', 'remount,ro', '/boot'], check=False)
            subprocess.run(['mount', '-o', 'remount,ro', '/boot/firmware'], check=False)
        except:
            pass

        return True

    except Exception as e:
        logger.error(f"✗ Failed to update FullPageOS URL: {e}")
        return False


def main():
    """Main configuration process."""
    logger.info("=" * 60)
    logger.info("FarmaDisplay - FullPageOS Configuration")
    logger.info("=" * 60)
    logger.info("")

    # Check if running as root
    if os.geteuid() != 0:
        logger.error("✗ This script must be run as root")
        logger.error("Please run with: sudo python3 configure_fullpageos.py <config.json>")
        sys.exit(1)

    # Check arguments
    if len(sys.argv) < 2:
        logger.error("✗ Missing configuration file argument")
        logger.error("Usage: python3 configure_fullpageos.py <config.json>")
        sys.exit(1)

    config_file = sys.argv[1]

    # Load configuration
    config = load_config(config_file)
    if not config:
        logger.error("✗ Failed to load configuration")
        sys.exit(1)

    # Extract configuration values
    wifi_ssid = config.get('wifi_ssid')
    wifi_password = config.get('wifi_password')
    display_url = config.get('display_url')
    pharmacy_name = config.get('pharmacy_name')
    display_id = config.get('display_id')

    logger.info("Configuration details:")
    logger.info(f"  Pharmacy: {pharmacy_name}")
    logger.info(f"  Display ID: {display_id}")
    logger.info(f"  WiFi SSID: {wifi_ssid}")
    logger.info(f"  Display URL: {display_url}")
    logger.info("")

    # Configure WiFi
    if not configure_wifi(wifi_ssid, wifi_password):
        logger.error("✗ WiFi configuration failed")
        sys.exit(1)

    # Test WiFi connectivity (non-blocking)
    test_wifi_connectivity()

    # Update FullPageOS URL
    if not update_fullpageos_url(display_url):
        logger.error("✗ FullPageOS URL update failed")
        sys.exit(1)

    logger.info("")
    logger.info("=" * 60)
    logger.info("✅ CONFIGURATION APPLIED SUCCESSFULLY")
    logger.info("=" * 60)
    logger.info("")
    logger.info("Next steps:")
    logger.info("  1. Device will reboot automatically")
    logger.info("  2. FullPageOS will load the configured display")
    logger.info(f"  3. Display URL: {display_url}")
    logger.info("")

    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("\nConfiguration interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"✗ Unexpected error: {e}", exc_info=True)
        sys.exit(1)
