#!/bin/bash
###############################################################################
# TurnoTec - Hotspot Manager
# Manages WiFi hotspot for device configuration
###############################################################################

set -e

# Configuration
HOTSPOT_SSID="TurnoTec"
HOTSPOT_PASSWORD="Bacheca2025"
HOTSPOT_IP="192.168.4.1"
HOTSPOT_INTERFACE="wlan0"
CONFIG_FILE="/opt/turnotec/config.json"
STATE_FILE="/opt/turnotec/state.json"

# Logging
LOG_FILE="/var/log/turnotec-hotspot.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check if device is configured
is_configured() {
    if [ -f "$CONFIG_FILE" ]; then
        configured=$(jq -r '.configured // false' "$CONFIG_FILE" 2>/dev/null || echo "false")
        if [ "$configured" = "true" ]; then
            return 0
        fi
    fi
    return 1
}

# Check if hotspot is active
is_hotspot_active() {
    if systemctl is-active --quiet hostapd && systemctl is-active --quiet dnsmasq; then
        return 0
    fi
    return 1
}

# Start hotspot
start_hotspot() {
    log "Starting hotspot..."

    # Stop any existing network manager interference
    if systemctl is-active --quiet NetworkManager; then
        log "Stopping NetworkManager temporarily..."
        systemctl stop NetworkManager
    fi

    # Bring down wlan0 if up
    ip link set "$HOTSPOT_INTERFACE" down 2>/dev/null || true

    # Configure hostapd
    log "Configuring hostapd..."
    cat > /etc/hostapd/hostapd.conf <<EOF
interface=${HOTSPOT_INTERFACE}
driver=nl80211
ssid=${HOTSPOT_SSID}
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=${HOTSPOT_PASSWORD}
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
EOF

    # Set hostapd config location
    sed -i 's|^#DAEMON_CONF=.*|DAEMON_CONF="/etc/hostapd/hostapd.conf"|' /etc/default/hostapd

    # Configure dnsmasq
    log "Configuring dnsmasq..."
    cat > /etc/dnsmasq.d/turnotec.conf <<EOF
interface=${HOTSPOT_INTERFACE}
dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h
domain=turnotec.local
address=/turnotec.local/${HOTSPOT_IP}
EOF

    # Configure network interface
    log "Configuring network interface..."
    ip link set "$HOTSPOT_INTERFACE" up
    ip addr flush dev "$HOTSPOT_INTERFACE"
    ip addr add "${HOTSPOT_IP}/24" dev "$HOTSPOT_INTERFACE"

    # Enable IP forwarding
    echo 1 > /proc/sys/net/ipv4/ip_forward

    # Start services
    log "Starting hostapd and dnsmasq..."
    systemctl unmask hostapd 2>/dev/null || true
    systemctl unmask dnsmasq 2>/dev/null || true
    systemctl enable hostapd dnsmasq
    systemctl restart hostapd
    systemctl restart dnsmasq

    # Wait for services to start
    sleep 3

    if is_hotspot_active; then
        log "Hotspot started successfully: SSID=${HOTSPOT_SSID}"

        # Update state
        mkdir -p "$(dirname "$STATE_FILE")"
        echo "{\"hotspot_active\": true, \"last_started\": \"$(date -Iseconds)\"}" > "$STATE_FILE"

        return 0
    else
        log "ERROR: Failed to start hotspot"
        return 1
    fi
}

# Stop hotspot
stop_hotspot() {
    log "Stopping hotspot..."

    # Stop services
    systemctl stop hostapd 2>/dev/null || true
    systemctl stop dnsmasq 2>/dev/null || true
    systemctl disable hostapd 2>/dev/null || true
    systemctl disable dnsmasq 2>/dev/null || true

    # Remove IP address from interface
    ip addr flush dev "$HOTSPOT_INTERFACE" 2>/dev/null || true

    # Restart NetworkManager if it was running
    if systemctl is-enabled --quiet NetworkManager 2>/dev/null; then
        log "Restarting NetworkManager..."
        systemctl start NetworkManager
    fi

    # Update state
    if [ -f "$STATE_FILE" ]; then
        echo "{\"hotspot_active\": false, \"last_stopped\": \"$(date -Iseconds)\"}" > "$STATE_FILE"
    fi

    log "Hotspot stopped"
}

# Main logic
case "${1:-auto}" in
    start)
        start_hotspot
        ;;
    stop)
        stop_hotspot
        ;;
    restart)
        stop_hotspot
        sleep 2
        start_hotspot
        ;;
    auto)
        # Auto mode: start if not configured, stop if configured
        if is_configured; then
            log "Device is configured, ensuring hotspot is stopped..."
            if is_hotspot_active; then
                stop_hotspot
            fi
        else
            log "Device not configured, ensuring hotspot is running..."
            if ! is_hotspot_active; then
                start_hotspot
            fi
        fi
        ;;
    status)
        if is_hotspot_active; then
            echo "Hotspot is ACTIVE"
            echo "SSID: $HOTSPOT_SSID"
            echo "IP: $HOTSPOT_IP"
            exit 0
        else
            echo "Hotspot is INACTIVE"
            exit 1
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|auto|status}"
        exit 1
        ;;
esac
