#!/usr/bin/env python3
"""
Network Healing Daemon for TurnoTec
Monitors network connectivity and automatically switches between Ethernet and WiFi
"""

import time
import subprocess
import logging
from datetime import datetime

# Configuration
CHECK_INTERVAL = 30  # seconds
PING_HOST = "8.8.8.8"
PING_TIMEOUT = 5
LOG_FILE = "/var/log/turnotec-network.log"

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


def check_connectivity():
    """Check internet connectivity by pinging Google DNS."""
    try:
        subprocess.run(
            ['ping', '-c', '1', '-W', str(PING_TIMEOUT), PING_HOST],
            check=True,
            capture_output=True,
            timeout=PING_TIMEOUT + 1
        )
        return True
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        return False


def get_active_interface():
    """Get the currently active network interface."""
    try:
        result = subprocess.run(
            ['ip', 'route', 'get', '8.8.8.8'],
            capture_output=True,
            text=True,
            check=True
        )
        # Parse output to get interface name
        output = result.stdout
        if 'dev' in output:
            parts = output.split('dev')[1].split()
            return parts[0] if parts else None
    except subprocess.CalledProcessError:
        return None


def restart_networking():
    """Restart networking services."""
    logger.info("Restarting networking services...")
    try:
        subprocess.run(['systemctl', 'restart', 'dhcpcd'], check=True)
        time.sleep(5)
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to restart networking: {e}")
        return False


def switch_to_wifi():
    """Switch to WiFi interface."""
    logger.info("Switching to WiFi...")
    try:
        subprocess.run(['ifconfig', 'wlan0', 'up'], check=True)
        time.sleep(2)
        subprocess.run(['dhclient', 'wlan0'], check=True)
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to switch to WiFi: {e}")
        return False


def switch_to_ethernet():
    """Switch to Ethernet interface."""
    logger.info("Switching to Ethernet...")
    try:
        subprocess.run(['ifconfig', 'eth0', 'up'], check=True)
        time.sleep(2)
        subprocess.run(['dhclient', 'eth0'], check=True)
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to switch to Ethernet: {e}")
        return False


def main():
    """Main daemon loop."""
    logger.info("TurnoTec Network Healing Daemon started")
    consecutive_failures = 0
    last_interface = None

    while True:
        try:
            has_internet = check_connectivity()
            current_interface = get_active_interface()

            if has_internet:
                if consecutive_failures > 0:
                    logger.info("Connection restored!")
                consecutive_failures = 0
                last_interface = current_interface
            else:
                consecutive_failures += 1
                logger.warning(f"No connectivity detected (attempt {consecutive_failures})")

                if consecutive_failures >= 2:
                    logger.error("Connection lost, attempting to heal...")

                    # Try restarting networking first
                    if restart_networking():
                        time.sleep(5)
                        if check_connectivity():
                            logger.info("Connection restored via restart")
                            consecutive_failures = 0
                            continue

                    # Try switching interfaces
                    if last_interface == 'eth0':
                        if switch_to_wifi():
                            time.sleep(5)
                            if check_connectivity():
                                logger.info("Connection restored via WiFi")
                                consecutive_failures = 0
                    else:
                        if switch_to_ethernet():
                            time.sleep(5)
                            if check_connectivity():
                                logger.info("Connection restored via Ethernet")
                                consecutive_failures = 0

            time.sleep(CHECK_INTERVAL)

        except KeyboardInterrupt:
            logger.info("Network Healing Daemon stopped by user")
            break
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    main()
