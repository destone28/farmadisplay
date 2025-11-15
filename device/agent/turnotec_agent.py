#!/usr/bin/env python3
"""
TurnoTec Device Agent

Runs on Raspberry Pi to:
- Send periodic heartbeats with monitoring data
- Poll and execute remote commands from backend
- Manage device lifecycle

Configuration is read from /opt/turnotec/config.json
"""

import json
import logging
import os
import platform
import psutil
import requests
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

# Configuration
CONFIG_PATH = "/opt/turnotec/config.json"
LOG_PATH = "/var/log/turnotec/agent.log"
HEARTBEAT_INTERVAL = 60  # seconds
COMMAND_POLL_INTERVAL = 30  # seconds
DEFAULT_DOMAIN = "turnotec.com"

# Setup logging
os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_PATH),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("TurnoTecAgent")


class TurnoTecAgent:
    """Device agent for remote monitoring and control."""

    def __init__(self):
        """Initialize the agent."""
        self.config = self.load_config()
        self.device_id = self.config.get("device_id")
        self.serial_number = self.config.get("serial_number")
        self.api_base = f"https://{self.config.get('domain', DEFAULT_DOMAIN)}/api/v1"
        self.last_heartbeat = 0
        self.last_command_poll = 0

        if not self.device_id or not self.serial_number:
            logger.error("Device not configured. Missing device_id or serial_number.")
            raise ValueError("Device not configured")

        logger.info(f"Agent initialized for device {self.device_id}")

    def load_config(self) -> Dict[str, Any]:
        """Load configuration from JSON file."""
        try:
            with open(CONFIG_PATH, 'r') as f:
                config = json.load(f)
                logger.info(f"Configuration loaded from {CONFIG_PATH}")
                return config
        except FileNotFoundError:
            logger.error(f"Configuration file not found: {CONFIG_PATH}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in config file: {e}")
            raise

    def get_ip_address(self) -> Optional[str]:
        """Get the device's IP address."""
        try:
            # Try to get IP from primary interface
            addrs = psutil.net_if_addrs()
            # Prefer eth0, then wlan0, then any other
            for interface in ['eth0', 'wlan0']:
                if interface in addrs:
                    for addr in addrs[interface]:
                        if addr.family == 2:  # AF_INET (IPv4)
                            return addr.address

            # Fallback: get any IPv4 address
            for interface, addrs_list in addrs.items():
                for addr in addrs_list:
                    if addr.family == 2 and not addr.address.startswith('127.'):
                        return addr.address

            return None
        except Exception as e:
            logger.warning(f"Failed to get IP address: {e}")
            return None

    def get_uptime_seconds(self) -> int:
        """Get system uptime in seconds."""
        try:
            return int(time.time() - psutil.boot_time())
        except Exception as e:
            logger.warning(f"Failed to get uptime: {e}")
            return 0

    def get_cpu_usage(self) -> float:
        """Get CPU usage percentage."""
        try:
            return psutil.cpu_percent(interval=1)
        except Exception as e:
            logger.warning(f"Failed to get CPU usage: {e}")
            return 0.0

    def get_memory_usage(self) -> float:
        """Get memory usage percentage."""
        try:
            return psutil.virtual_memory().percent
        except Exception as e:
            logger.warning(f"Failed to get memory usage: {e}")
            return 0.0

    def get_disk_usage(self) -> float:
        """Get disk usage percentage."""
        try:
            return psutil.disk_usage('/').percent
        except Exception as e:
            logger.warning(f"Failed to get disk usage: {e}")
            return 0.0

    def get_temperature(self) -> Optional[float]:
        """Get CPU temperature (Raspberry Pi specific)."""
        try:
            # Try Raspberry Pi method
            temp_file = Path("/sys/class/thermal/thermal_zone0/temp")
            if temp_file.exists():
                temp = float(temp_file.read_text().strip()) / 1000.0
                return temp

            # Fallback: try vcgencmd (legacy)
            result = subprocess.run(
                ["vcgencmd", "measure_temp"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                # Output format: temp=42.8'C
                temp_str = result.stdout.strip().split('=')[1].split("'")[0]
                return float(temp_str)

            return None
        except Exception as e:
            logger.debug(f"Failed to get temperature: {e}")
            return None

    def send_heartbeat(self) -> bool:
        """Send heartbeat to backend with monitoring data."""
        try:
            url = f"{self.api_base}/devices/{self.device_id}/heartbeat"

            payload = {
                "serial_number": self.serial_number,
                "status": "active",
                "firmware_version": self.config.get("firmware_version", "1.0.0"),
                "ip_address": self.get_ip_address(),
                "uptime_seconds": self.get_uptime_seconds(),
                "cpu_usage": self.get_cpu_usage(),
                "memory_usage": self.get_memory_usage(),
                "disk_usage": self.get_disk_usage(),
                "temperature": self.get_temperature()
            }

            logger.debug(f"Sending heartbeat: {payload}")

            response = requests.post(url, json=payload, timeout=10)
            response.raise_for_status()

            logger.info(f"Heartbeat sent successfully. Status: online, IP: {payload['ip_address']}")
            self.last_heartbeat = time.time()
            return True

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to send heartbeat: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending heartbeat: {e}")
            return False

    def poll_commands(self) -> list:
        """Poll for pending commands from backend."""
        try:
            url = f"{self.api_base}/devices/{self.device_id}/commands/poll"

            payload = {
                "serial_number": self.serial_number
            }

            response = requests.post(url, json=payload, timeout=10)
            response.raise_for_status()

            commands = response.json()
            self.last_command_poll = time.time()

            if commands:
                logger.info(f"Received {len(commands)} command(s) to execute")

            return commands

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to poll commands: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error polling commands: {e}")
            return []

    def update_command_status(self, command_id: str, status: str, result: str = None, error: str = None) -> bool:
        """Update command execution status."""
        try:
            url = f"{self.api_base}/devices/commands/{command_id}"

            payload = {
                "status": status
            }

            if result:
                payload["result"] = result
            if error:
                payload["error"] = error

            response = requests.put(url, json=payload, timeout=10)
            response.raise_for_status()

            logger.info(f"Command {command_id} status updated to {status}")
            return True

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to update command status: {e}")
            return False

    def execute_command(self, command: Dict[str, Any]) -> None:
        """Execute a command received from backend."""
        command_id = command["id"]
        command_type = command["command_type"]
        command_data = command.get("command_data")

        logger.info(f"Executing command {command_id}: {command_type}")

        # Update status to EXECUTING
        self.update_command_status(command_id, "executing")

        try:
            if command_type == "reboot":
                self.execute_reboot(command_id)

            elif command_type == "update":
                self.execute_update(command_id, command_data)

            elif command_type == "execute":
                self.execute_shell_command(command_id, command_data)

            else:
                error_msg = f"Unknown command type: {command_type}"
                logger.error(error_msg)
                self.update_command_status(command_id, "failed", error=error_msg)

        except Exception as e:
            error_msg = f"Command execution failed: {str(e)}"
            logger.error(error_msg)
            self.update_command_status(command_id, "failed", error=error_msg)

    def execute_reboot(self, command_id: str) -> None:
        """Execute reboot command."""
        logger.info("Rebooting device in 5 seconds...")
        self.update_command_status(command_id, "completed", result="Reboot initiated")

        # Give time for status update to be sent
        time.sleep(2)

        # Execute reboot
        subprocess.run(["sudo", "reboot"], check=True)

    def execute_update(self, command_id: str, command_data: Optional[str]) -> None:
        """Execute software update."""
        logger.info("Executing software update...")

        try:
            # Parse update data if provided
            update_config = {}
            if command_data:
                update_config = json.loads(command_data)

            # Update TurnoTec agent
            update_script = Path("/opt/turnotec/scripts/update_agent.sh")
            if update_script.exists():
                result = subprocess.run(
                    ["sudo", "bash", str(update_script)],
                    capture_output=True,
                    text=True,
                    timeout=300
                )

                if result.returncode == 0:
                    self.update_command_status(
                        command_id,
                        "completed",
                        result=f"Update completed successfully\n{result.stdout}"
                    )
                else:
                    self.update_command_status(
                        command_id,
                        "failed",
                        error=f"Update failed\n{result.stderr}"
                    )
            else:
                self.update_command_status(
                    command_id,
                    "failed",
                    error="Update script not found"
                )

        except subprocess.TimeoutExpired:
            self.update_command_status(command_id, "failed", error="Update timeout")
        except Exception as e:
            self.update_command_status(command_id, "failed", error=str(e))

    def execute_shell_command(self, command_id: str, command_data: str) -> None:
        """Execute a shell command (admin only)."""
        if not command_data:
            self.update_command_status(command_id, "failed", error="No command provided")
            return

        try:
            command_config = json.loads(command_data)
            shell_command = command_config.get("command")

            if not shell_command:
                self.update_command_status(command_id, "failed", error="No command in data")
                return

            logger.info(f"Executing shell command: {shell_command}")

            result = subprocess.run(
                shell_command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=60
            )

            output = f"Exit code: {result.returncode}\n\nSTDOUT:\n{result.stdout}\n\nSTDERR:\n{result.stderr}"

            if result.returncode == 0:
                self.update_command_status(command_id, "completed", result=output)
            else:
                self.update_command_status(command_id, "failed", error=output)

        except subprocess.TimeoutExpired:
            self.update_command_status(command_id, "failed", error="Command timeout")
        except Exception as e:
            self.update_command_status(command_id, "failed", error=str(e))

    def run(self) -> None:
        """Main agent loop."""
        logger.info("TurnoTec Agent started")

        # Send initial heartbeat
        self.send_heartbeat()

        while True:
            try:
                current_time = time.time()

                # Send heartbeat
                if current_time - self.last_heartbeat >= HEARTBEAT_INTERVAL:
                    self.send_heartbeat()

                # Poll for commands
                if current_time - self.last_command_poll >= COMMAND_POLL_INTERVAL:
                    commands = self.poll_commands()

                    # Execute received commands
                    for command in commands:
                        self.execute_command(command)

                # Sleep for a bit
                time.sleep(5)

            except KeyboardInterrupt:
                logger.info("Agent stopped by user")
                break
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                time.sleep(10)  # Wait before retrying


def main():
    """Main entry point."""
    try:
        agent = TurnoTecAgent()
        agent.run()
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
