#!/usr/bin/env python3
"""
Bluetooth WiFi Configuration Server for TurnoTec
Allows configuration of WiFi via Bluetooth from a mobile app
"""

import bluetooth
import json
import subprocess
import logging

# Configuration
SERVICE_UUID = "00001101-0000-1000-8000-00805F9B34FB"
SERVICE_NAME = "TurnoTec WiFi Config"
LOG_FILE = "/var/log/turnotec-bt-config.log"

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


def configure_wifi(ssid, password):
    """Configure WiFi with provided credentials."""
    try:
        # Create wpa_supplicant configuration
        config = f"""
country=IT
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={{
    ssid="{ssid}"
    psk="{password}"
    key_mgmt=WPA-PSK
}}
"""
        # Write to wpa_supplicant.conf
        with open('/etc/wpa_supplicant/wpa_supplicant.conf', 'w') as f:
            f.write(config)

        # Restart networking
        subprocess.run(['wpa_cli', '-i', 'wlan0', 'reconfigure'], check=True)
        logger.info(f"WiFi configured successfully: {ssid}")
        return True

    except Exception as e:
        logger.error(f"Failed to configure WiFi: {e}")
        return False


def handle_client(client_sock, client_info):
    """Handle Bluetooth client connection."""
    logger.info(f"Client connected: {client_info}")

    try:
        # Send welcome message
        welcome = json.dumps({
            "status": "ready",
            "message": "TurnoTec WiFi Configuration",
            "version": "1.0"
        })
        client_sock.send(welcome.encode('utf-8'))

        # Receive WiFi credentials
        data = client_sock.recv(1024).decode('utf-8')
        logger.info(f"Received data: {data}")

        credentials = json.loads(data)
        ssid = credentials.get('ssid')
        password = credentials.get('password')

        if not ssid or not password:
            response = json.dumps({
                "status": "error",
                "message": "Missing SSID or password"
            })
            client_sock.send(response.encode('utf-8'))
            return

        # Configure WiFi
        success = configure_wifi(ssid, password)

        if success:
            response = json.dumps({
                "status": "success",
                "message": f"WiFi configured: {ssid}"
            })
        else:
            response = json.dumps({
                "status": "error",
                "message": "Failed to configure WiFi"
            })

        client_sock.send(response.encode('utf-8'))

    except Exception as e:
        logger.error(f"Error handling client: {e}")
        try:
            error_response = json.dumps({
                "status": "error",
                "message": str(e)
            })
            client_sock.send(error_response.encode('utf-8'))
        except:
            pass

    finally:
        client_sock.close()
        logger.info(f"Client disconnected: {client_info}")


def main():
    """Main Bluetooth server loop."""
    logger.info("Starting Bluetooth WiFi Configuration Server")

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

    logger.info(f"Waiting for connections on RFCOMM channel {port}")

    try:
        while True:
            client_sock, client_info = server_sock.accept()
            handle_client(client_sock, client_info)

    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    finally:
        server_sock.close()
        logger.info("Server socket closed")


if __name__ == "__main__":
    main()
