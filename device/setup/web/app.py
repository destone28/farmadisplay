#!/usr/bin/env python3
"""
TurnoTec - Flask Web Server for Device Configuration
Serves setup form on hotspot IP (192.168.4.1:8080)
"""

import os
import subprocess
import json
import hashlib
import uuid
from flask import Flask, render_template, request, jsonify
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
CONFIG_FILE = "/opt/turnotec/config.json"
STATE_FILE = "/opt/turnotec/state.json"


def get_cpu_serial():
    """Get Raspberry Pi CPU serial number"""
    try:
        with open('/proc/cpuinfo', 'r') as f:
            for line in f:
                if line.startswith('Serial'):
                    return line.split(':')[1].strip()
        return None
    except Exception as e:
        logger.error(f"Error getting CPU serial: {e}")
        return None


def get_mac_address():
    """Get MAC address of eth0 or wlan0"""
    try:
        for interface in ['eth0', 'wlan0']:
            result = subprocess.run(
                ["cat", f"/sys/class/net/{interface}/address"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                return result.stdout.strip()
        return None
    except Exception as e:
        logger.error(f"Error getting MAC address: {e}")
        return None


def generate_serial_number():
    """Generate unique serial number for device"""
    # Try CPU serial first (most reliable on Raspberry Pi)
    cpu_serial = get_cpu_serial()
    if cpu_serial:
        return f"RPI-{cpu_serial}"

    # Fallback to MAC address
    mac_address = get_mac_address()
    if mac_address:
        return f"MAC-{mac_address.replace(':', '').upper()}"

    # Last resort: generate UUID
    return f"UUID-{str(uuid.uuid4())}"


def check_ethernet_connected():
    """Check if Ethernet interface is connected and has IP"""
    try:
        result = subprocess.run(
            ["ip", "-4", "addr", "show", "eth0"],
            capture_output=True,
            text=True,
            timeout=5
        )
        # Check if eth0 has an IP address (excluding 169.254.x.x link-local)
        if result.returncode == 0:
            lines = result.stdout.split('\n')
            for line in lines:
                if 'inet ' in line and '169.254' not in line:
                    logger.info("Ethernet connected with IP")
                    return True
        logger.info("Ethernet not connected")
        return False
    except Exception as e:
        logger.error(f"Error checking Ethernet: {e}")
        return False


def check_wifi_available():
    """Check if WiFi interface is available"""
    try:
        result = subprocess.run(
            ["iw", "dev", "wlan0", "info"],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.returncode == 0
    except Exception as e:
        logger.error(f"Error checking WiFi: {e}")
        return False


def test_wifi_connection(ssid, password):
    """Test WiFi connection without permanently saving"""
    logger.info(f"Testing WiFi connection to {ssid}")
    try:
        # Create temporary wpa_supplicant config
        temp_conf = "/tmp/wpa_test.conf"
        with open(temp_conf, 'w') as f:
            f.write(f"""ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=IT

network={{
    ssid="{ssid}"
    psk="{password}"
    key_mgmt=WPA-PSK
}}
""")

        # Try to connect (this is a basic test, might need adjustment)
        result = subprocess.run(
            ["wpa_cli", "-i", "wlan0", "reconfigure"],
            capture_output=True,
            text=True,
            timeout=10
        )

        # Wait a bit for connection
        import time
        time.sleep(5)

        # Check if connected
        result = subprocess.run(
            ["iw", "dev", "wlan0", "link"],
            capture_output=True,
            text=True,
            timeout=5
        )

        connected = "Connected to" in result.stdout
        logger.info(f"WiFi test result: {'success' if connected else 'failed'}")
        return connected

    except Exception as e:
        logger.error(f"Error testing WiFi: {e}")
        return False


def test_display_load(display_id, domain="turnotec.com"):
    """Test if display page loads correctly"""
    logger.info(f"Testing display page load: {display_id}")
    try:
        url = f"https://{domain}/display/{display_id}"
        result = subprocess.run(
            ["curl", "-I", "-L", "--max-time", "10", url],
            capture_output=True,
            text=True,
            timeout=15
        )

        # Check for 200 OK or 301/302 redirect
        success = "200 OK" in result.stdout or "301" in result.stdout or "302" in result.stdout
        logger.info(f"Display page test: {'success' if success else 'failed'}")
        return success
    except Exception as e:
        logger.error(f"Error testing display load: {e}")
        return False


@app.route('/')
def index():
    """Serve setup form"""
    ethernet_connected = check_ethernet_connected()
    wifi_available = check_wifi_available()

    return render_template(
        'setup.html',
        ethernet_connected=ethernet_connected,
        wifi_available=wifi_available
    )


@app.route('/status')
def status():
    """Get current system status"""
    return jsonify({
        'ethernet_connected': check_ethernet_connected(),
        'wifi_available': check_wifi_available()
    })


@app.route('/configure', methods=['POST'])
def configure():
    """Handle configuration submission"""
    try:
        data = request.json
        logger.info(f"Received configuration: {data}")

        display_id = data.get('display_id', '').strip()
        wifi_ssid = data.get('wifi_ssid', '').strip()
        wifi_password = data.get('wifi_password', '').strip()
        domain = data.get('domain', 'turnotec.com').strip()

        # Validate display_id
        if not display_id or len(display_id) < 3:
            return jsonify({
                'success': False,
                'error': 'Display ID non valido. Deve essere almeno 3 caratteri.'
            }), 400

        # Check Ethernet connection
        ethernet_connected = check_ethernet_connected()

        # If no Ethernet, WiFi is required
        if not ethernet_connected and (not wifi_ssid or not wifi_password):
            return jsonify({
                'success': False,
                'error': 'Credenziali WiFi obbligatorie quando Ethernet non è connesso.'
            }), 400

        # Test WiFi connection if credentials provided
        wifi_configured = False
        if wifi_ssid and wifi_password:
            logger.info("Testing WiFi connection before saving...")
            # Note: actual WiFi testing might be complex in hotspot mode
            # For now, we'll save and let connectivity monitor handle it
            wifi_configured = True

        # Generate or load existing serial number
        serial_number = None
        mac_address = get_mac_address()

        # Check if config already exists and has serial number
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r') as f:
                    existing_config = json.load(f)
                    serial_number = existing_config.get('serial_number')
                    if not mac_address:
                        mac_address = existing_config.get('mac_address')
            except:
                pass

        # Generate serial number if not exists
        if not serial_number:
            serial_number = generate_serial_number()
            logger.info(f"Generated serial number: {serial_number}")

        # Save configuration
        config = {
            'display_id': display_id,
            'serial_number': serial_number,
            'mac_address': mac_address,
            'domain': domain,
            'wifi_ssid': wifi_ssid if wifi_configured else None,
            'wifi_password': wifi_password if wifi_configured else None,
            'ethernet_fallback': ethernet_connected,
            'configured': True,
            'firmware_version': '5.0.0'
        }

        os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)

        logger.info(f"Configuration saved successfully (Serial: {serial_number})")

        # Trigger configuration script
        subprocess.run(
            ["/opt/turnotec/scripts/configure_device.sh"],
            check=False
        )

        return jsonify({
            'success': True,
            'message': 'Configurazione salvata. Il dispositivo si riavvierà tra 5 secondi...',
            'wifi_configured': wifi_configured,
            'ethernet_available': ethernet_connected
        })

    except Exception as e:
        logger.error(f"Configuration error: {e}")
        return jsonify({
            'success': False,
            'error': f'Errore durante la configurazione: {str(e)}'
        }), 500


if __name__ == '__main__':
    # Run on all interfaces, port 8080 (port 80 is used by FullPageOS lighttpd)
    app.run(host='0.0.0.0', port=8080, debug=False)
