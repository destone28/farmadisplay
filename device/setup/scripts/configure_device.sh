#!/bin/bash
###############################################################################
# TurnoTec - Device Configuration Script
# Applies WiFi and display URL configuration
###############################################################################

set -e

# Configuration
CONFIG_FILE="/opt/turnotec/config.json"
STATE_FILE="/opt/turnotec/state.json"
WPA_SUPPLICANT="/etc/wpa_supplicant/wpa_supplicant.conf"
LOG_FILE="/var/log/turnotec-configure.log"

# Detect FullPageOS boot path
BOOT_PATH="/boot"
if [ -f "$STATE_FILE" ]; then
    BOOT_PATH=$(jq -r '.boot_path // "/boot"' "$STATE_FILE")
elif [ -d "/boot/firmware" ]; then
    BOOT_PATH="/boot/firmware"
fi

FULLPAGEOS_CONFIG="$BOOT_PATH/fullpageos.txt"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    log "ERROR: $1"
    exit 1
}

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    error "Configuration file not found: $CONFIG_FILE"
fi

log "Reading configuration..."

# Read configuration
DISPLAY_ID=$(jq -r '.display_id' "$CONFIG_FILE")
DOMAIN=$(jq -r '.domain // "turnotec.com"' "$CONFIG_FILE")
WIFI_SSID=$(jq -r '.wifi_ssid // ""' "$CONFIG_FILE")
WIFI_PASSWORD=$(jq -r '.wifi_password // ""' "$CONFIG_FILE")

log "Display ID: $DISPLAY_ID"
log "Domain: $DOMAIN"
log "WiFi SSID: ${WIFI_SSID:-<none>}"

# Validate display ID
if [ -z "$DISPLAY_ID" ] || [ "$DISPLAY_ID" = "null" ]; then
    error "Invalid display ID"
fi

# Configure WiFi if credentials provided
if [ -n "$WIFI_SSID" ] && [ "$WIFI_SSID" != "null" ] && [ -n "$WIFI_PASSWORD" ] && [ "$WIFI_PASSWORD" != "null" ]; then
    log "Configuring WiFi..."

    # Backup existing wpa_supplicant.conf
    if [ -f "$WPA_SUPPLICANT" ]; then
        cp "$WPA_SUPPLICANT" "${WPA_SUPPLICANT}.backup.$(date +%s)"
    fi

    # Generate PSK hash using Python PBKDF2 to handle special characters correctly
    # This prevents issues with passwords containing #, !, $, ", ', etc.
    log "Generating secure PSK hash for WiFi password..."

    # Use Python script to generate WPA2-PSK hash using PBKDF2-HMAC-SHA1
    # This is the same algorithm used by wpa_passphrase
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PSK_HASH=$("$SCRIPT_DIR/generate_psk.py" "$WIFI_SSID" "$WIFI_PASSWORD" 2>&1)

    if [ $? -ne 0 ] || [ -z "$PSK_HASH" ]; then
        error "Failed to generate PSK hash: $PSK_HASH"
    fi

    # Validate PSK hash format (must be 64 hex characters)
    if ! echo "$PSK_HASH" | grep -qE '^[0-9a-f]{64}$'; then
        error "Invalid PSK hash format: $PSK_HASH"
    fi

    log "PSK hash generated successfully"

    # Create new wpa_supplicant.conf with hashed PSK
    cat > "$WPA_SUPPLICANT" <<EOF
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=IT

network={
    ssid="${WIFI_SSID}"
    psk=${PSK_HASH}
    key_mgmt=WPA-PSK
    priority=10
}
EOF

    chmod 600 "$WPA_SUPPLICANT"
    log "WiFi configuration saved with secure PSK hash"

    # Reconfigure wpa_supplicant
    wpa_cli -i wlan0 reconfigure 2>/dev/null || true
else
    log "No WiFi credentials provided, skipping WiFi configuration"
fi

# Configure FullPageOS display URL
log "Configuring FullPageOS display URL..."
log "Boot path: $BOOT_PATH"

DISPLAY_URL="https://${DOMAIN}/display/${DISPLAY_ID}"
log "Display URL: $DISPLAY_URL"

# Backup existing fullpageos.txt
if [ -f "$FULLPAGEOS_CONFIG" ]; then
    cp "$FULLPAGEOS_CONFIG" "${FULLPAGEOS_CONFIG}.backup.$(date +%s)"
fi

# FullPageOS reads only the first line of fullpageos.txt as the URL
# No need for FULLPAGEOS_URL= prefix - just the URL
echo "$DISPLAY_URL" > "$FULLPAGEOS_CONFIG"

log "FullPageOS configuration saved to $FULLPAGEOS_CONFIG"

# Mark as configured
jq '.configured = true | .configured_at = "'$(date -Iseconds)'"' "$CONFIG_FILE" > "${CONFIG_FILE}.tmp"
mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"

log "Configuration applied successfully"

# Stop hotspot (will be handled by hotspot_manager)
/opt/turnotec/scripts/hotspot_manager.sh stop || true

# Schedule reboot
log "Scheduling reboot in 5 seconds..."
(sleep 5 && reboot) &

log "Device will reboot shortly"

exit 0
