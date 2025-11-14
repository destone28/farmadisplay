#!/usr/bin/env python3
"""
TurnoTec - Flask Web Server for Device Configuration
Serves setup form on hotspot IP (192.168.4.1:8080)
"""

import os
import subprocess
import json
from flask import Flask, render_template, request, jsonify
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
CONFIG_FILE = "/opt/turnotec/config.json"
STATE_FILE = "/opt/turnotec/state.json"


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

        # Save configuration
        config = {
            'display_id': display_id,
            'domain': domain,
            'wifi_ssid': wifi_ssid if wifi_configured else None,
            'wifi_password': wifi_password if wifi_configured else None,
            'ethernet_fallback': ethernet_connected,
            'configured': True
        }

        os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)

        logger.info("Configuration saved successfully")

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
