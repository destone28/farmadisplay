#!/usr/bin/env python3
"""
FarmaDisplay - Bluetooth Configuration Receiver
Receives configuration JSON from smartphone via Bluetooth and applies it

Expected JSON structure:
{
  "pharmacy_name": "Fior di Loto",
  "pharmacy_id": "c470809e-14be-42c0-ac9c-0d2e2914e33f",
  "display_id": "3ri8zb",
  "wifi_ssid": "provolino",
  "wifi_password": "Provoletto123",
  "display_url": "http://localhost:5173/display/3ri8zb",
  "generated_at": "2025-11-13T14:12:38.620820"
}
"""

import bluetooth
import json
import logging
import subprocess
import sys
from pathlib import Path
from datetime import datetime

# Configuration
SERVICE_UUID = "00001101-0000-1000-8000-00805F9B34FB"
SERVICE_NAME = "FarmaDisplay Config"
CONFIG_FILE = Path("/home/pi/.turnotec/config.json")
LOG_FILE = "/var/log/farmadisplay-bt-config.log"

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


def validate_config(config):
    """
    Validate received configuration JSON.

    Args:
        config: Dictionary with configuration data

    Returns:
        tuple: (is_valid, error_message)
    """
    required_fields = [
        'pharmacy_name',
        'pharmacy_id',
        'display_id',
        'wifi_ssid',
        'wifi_password',
        'display_url'
    ]

    # Check all required fields are present
    missing_fields = [field for field in required_fields if field not in config]

    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"

    # Validate non-empty values
    empty_fields = [
        field for field in required_fields
        if not config[field] or str(config[field]).strip() == ''
    ]

    if empty_fields:
        return False, f"Empty values for fields: {', '.join(empty_fields)}"

    # Validate display_id format (should be 6 chars, lowercase + digits)
    display_id = config['display_id']
    if len(display_id) != 6 or not display_id.isalnum() or not display_id.islower():
        return False, f"Invalid display_id format: {display_id} (expected 6 lowercase alphanumeric chars)"

    # Validate URL format
    display_url = config['display_url']
    if not display_url.startswith(('http://', 'https://')):
        return False, f"Invalid display_url: must start with http:// or https://"

    # Validate WiFi SSID length
    wifi_ssid = config['wifi_ssid']
    if len(wifi_ssid) > 32:
        return False, f"WiFi SSID too long: {len(wifi_ssid)} chars (max 32)"

    # Validate WiFi password length
    wifi_password = config['wifi_password']
    if len(wifi_password) < 8:
        return False, f"WiFi password too short: {len(wifi_password)} chars (min 8)"
    if len(wifi_password) > 63:
        return False, f"WiFi password too long: {len(wifi_password)} chars (max 63)"

    return True, None


def save_config(config):
    """
    Save configuration to local file.

    Args:
        config: Dictionary with configuration data

    Returns:
        bool: True if successful
    """
    try:
        # Add metadata
        config['configured_at'] = datetime.now().isoformat()
        config['configuration_version'] = '1.0'

        # Ensure directory exists
        CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)

        # Write config file
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)

        # Set proper permissions (readable only by pi user and root)
        CONFIG_FILE.chmod(0o600)

        logger.info(f"✓ Configuration saved to {CONFIG_FILE}")
        return True

    except Exception as e:
        logger.error(f"✗ Failed to save configuration: {e}")
        return False


def apply_configuration(config):
    """
    Apply the received configuration by calling configure_fullpageos.py

    Args:
        config: Dictionary with configuration data

    Returns:
        bool: True if successful
    """
    try:
        logger.info("Applying configuration...")

        # Path to configuration script
        config_script = Path(__file__).parent / "configure_fullpageos.py"

        if not config_script.exists():
            logger.error(f"✗ Configuration script not found: {config_script}")
            return False

        # Execute configuration script
        result = subprocess.run(
            ['python3', str(config_script), str(CONFIG_FILE)],
            check=True,
            capture_output=True,
            text=True
        )

        logger.info("✓ Configuration applied successfully")
        logger.info(f"Output: {result.stdout}")

        return True

    except subprocess.CalledProcessError as e:
        logger.error(f"✗ Failed to apply configuration: {e}")
        logger.error(f"Error output: {e.stderr}")
        return False
    except Exception as e:
        logger.error(f"✗ Unexpected error applying configuration: {e}")
        return False


def handle_client(client_sock, client_info):
    """
    Handle incoming Bluetooth client connection.

    Args:
        client_sock: Bluetooth socket
        client_info: Client connection info

    Returns:
        bool: True if configuration was successful
    """
    logger.info(f"📱 Client connected: {client_info}")

    try:
        # Send welcome message
        welcome = {
            "status": "ready",
            "message": "FarmaDisplay Configuration Server",
            "version": "1.0",
            "timestamp": datetime.now().isoformat()
        }
        client_sock.send(json.dumps(welcome).encode('utf-8'))
        logger.info("✓ Welcome message sent")

        # Receive configuration data
        logger.info("Waiting for configuration data...")
        data = client_sock.recv(4096).decode('utf-8')

        if not data:
            error_msg = "No data received"
            logger.error(f"✗ {error_msg}")
            client_sock.send(json.dumps({
                "status": "error",
                "message": error_msg
            }).encode('utf-8'))
            return False

        logger.info(f"Received {len(data)} bytes of data")

        # Parse JSON
        try:
            config = json.loads(data)
            logger.info("✓ JSON parsed successfully")
            logger.info(f"Configuration: {json.dumps(config, indent=2)}")
        except json.JSONDecodeError as e:
            error_msg = f"Invalid JSON format: {e}"
            logger.error(f"✗ {error_msg}")
            client_sock.send(json.dumps({
                "status": "error",
                "message": error_msg
            }).encode('utf-8'))
            return False

        # Validate configuration
        is_valid, error_msg = validate_config(config)
        if not is_valid:
            logger.error(f"✗ Validation failed: {error_msg}")
            client_sock.send(json.dumps({
                "status": "error",
                "message": f"Validation failed: {error_msg}"
            }).encode('utf-8'))
            return False

        logger.info("✓ Configuration validated")

        # Save configuration
        if not save_config(config):
            error_msg = "Failed to save configuration"
            logger.error(f"✗ {error_msg}")
            client_sock.send(json.dumps({
                "status": "error",
                "message": error_msg
            }).encode('utf-8'))
            return False

        # Apply configuration (WiFi + FullPageOS URL)
        if not apply_configuration(config):
            error_msg = "Failed to apply configuration"
            logger.error(f"✗ {error_msg}")
            client_sock.send(json.dumps({
                "status": "error",
                "message": error_msg
            }).encode('utf-8'))
            return False

        # Send success response
        success_response = {
            "status": "success",
            "message": "Configuration applied successfully",
            "pharmacy_name": config['pharmacy_name'],
            "display_id": config['display_id'],
            "wifi_ssid": config['wifi_ssid'],
            "display_url": config['display_url']
        }

        client_sock.send(json.dumps(success_response).encode('utf-8'))
        logger.info("✓ Success response sent to client")

        logger.info("")
        logger.info("=" * 60)
        logger.info("✅ CONFIGURATION COMPLETED SUCCESSFULLY")
        logger.info("=" * 60)
        logger.info(f"Pharmacy: {config['pharmacy_name']}")
        logger.info(f"Display ID: {config['display_id']}")
        logger.info(f"WiFi SSID: {config['wifi_ssid']}")
        logger.info(f"Display URL: {config['display_url']}")
        logger.info("=" * 60)

        return True

    except Exception as e:
        logger.error(f"✗ Error handling client: {e}", exc_info=True)
        try:
            error_response = {
                "status": "error",
                "message": f"Unexpected error: {str(e)}"
            }
            client_sock.send(json.dumps(error_response).encode('utf-8'))
        except:
            pass
        return False

    finally:
        client_sock.close()
        logger.info(f"Client disconnected: {client_info}")


def main():
    """Main Bluetooth server loop."""
    logger.info("=" * 60)
    logger.info("FarmaDisplay - Bluetooth Configuration Receiver")
    logger.info("=" * 60)
    logger.info("")

    try:
        # Create Bluetooth server socket
        server_sock = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
        server_sock.bind(("", bluetooth.PORT_ANY))
        server_sock.listen(1)

        port = server_sock.getsockname()[1]

        # Advertise service
        bluetooth.advertise_service(
            server_sock,
            SERVICE_NAME,
            service_id=SERVICE_UUID,
            service_classes=[SERVICE_UUID, bluetooth.SERIAL_PORT_CLASS],
            profiles=[bluetooth.SERIAL_PORT_PROFILE]
        )

        logger.info(f"✓ Bluetooth server started on RFCOMM channel {port}")
        logger.info(f"✓ Service name: {SERVICE_NAME}")
        logger.info(f"✓ Service UUID: {SERVICE_UUID}")
        logger.info("")
        logger.info("Waiting for connection from smartphone...")
        logger.info("(This will accept only ONE configuration and then exit)")
        logger.info("")

        # Accept ONE connection only (for initial configuration)
        client_sock, client_info = server_sock.accept()

        # Handle the configuration
        success = handle_client(client_sock, client_info)

        # Close server socket
        server_sock.close()
        logger.info("✓ Bluetooth server closed")

        # Exit with appropriate code
        if success:
            logger.info("Configuration receiver exiting with success")
            sys.exit(0)
        else:
            logger.error("Configuration receiver exiting with failure")
            sys.exit(1)

    except KeyboardInterrupt:
        logger.info("\nServer stopped by user")
        sys.exit(1)

    except Exception as e:
        logger.error(f"✗ Server error: {e}", exc_info=True)
        sys.exit(1)

    finally:
        try:
            server_sock.close()
        except:
            pass


if __name__ == "__main__":
    main()
