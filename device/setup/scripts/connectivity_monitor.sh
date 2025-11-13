#!/bin/bash
###############################################################################
# TurnoTec - Connectivity Monitor
# Monitors WiFi connectivity and reactivates hotspot after 5 failed attempts
# Only if Ethernet is not connected
###############################################################################

# Configuration
CONFIG_FILE="/opt/turnotec/config.json"
LOG_FILE="/var/log/turnotec-monitor.log"
CHECK_INTERVAL=30  # seconds between checks
MAX_FAILURES=5
FAILURE_COUNT=0

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check if device is configured
is_configured() {
    if [ -f "$CONFIG_FILE" ]; then
        configured=$(jq -r '.configured // false' "$CONFIG_FILE" 2>/dev/null || echo "false")
        [ "$configured" = "true" ]
    else
        return 1
    fi
}

# Check if Ethernet is connected with valid IP
check_ethernet() {
    if ip -4 addr show eth0 2>/dev/null | grep -q "inet " | grep -v "169.254"; then
        return 0
    fi
    return 1
}

# Check if WiFi is connected
check_wifi() {
    if iw dev wlan0 link 2>/dev/null | grep -q "Connected to"; then
        return 0
    fi
    return 1
}

# Check if we have internet connectivity
check_internet() {
    # Try to ping gateway first (faster)
    if timeout 5 ping -c 1 -W 3 $(ip route | grep default | awk '{print $3}' | head -1) &>/dev/null; then
        return 0
    fi

    # Try to reach a public DNS
    if timeout 5 ping -c 1 -W 3 8.8.8.8 &>/dev/null; then
        return 0
    fi

    return 1
}

# Attempt to reconnect WiFi
reconnect_wifi() {
    log "Attempting to reconnect WiFi..."

    # Bring interface down and up
    ip link set wlan0 down
    sleep 2
    ip link set wlan0 up
    sleep 3

    # Reconfigure wpa_supplicant
    wpa_cli -i wlan0 reconfigure 2>/dev/null || true
    sleep 5

    # Check if connected
    if check_wifi; then
        log "WiFi reconnected successfully"
        return 0
    else
        log "WiFi reconnection failed"
        return 1
    fi
}

# Main monitoring loop
log "Connectivity monitor started"

while true; do
    # Only monitor if device is configured
    if ! is_configured; then
        log "Device not configured, skipping monitoring"
        sleep "$CHECK_INTERVAL"
        continue
    fi

    # Check Ethernet first
    if check_ethernet; then
        log "Ethernet connected - connectivity OK"
        FAILURE_COUNT=0
        sleep "$CHECK_INTERVAL"
        continue
    fi

    # Check WiFi
    if check_wifi; then
        # WiFi connected, check internet
        if check_internet; then
            log "WiFi connected - connectivity OK"
            FAILURE_COUNT=0
        else
            log "WiFi connected but no internet access"
            FAILURE_COUNT=$((FAILURE_COUNT + 1))
        fi
    else
        log "WiFi not connected"
        FAILURE_COUNT=$((FAILURE_COUNT + 1))

        # Try to reconnect
        reconnect_wifi
        if [ $? -eq 0 ]; then
            FAILURE_COUNT=0
            sleep "$CHECK_INTERVAL"
            continue
        fi
    fi

    # Check if we've exceeded max failures
    if [ "$FAILURE_COUNT" -ge "$MAX_FAILURES" ]; then
        log "WARNING: WiFi failed $FAILURE_COUNT times and Ethernet not available"
        log "Reactivating hotspot for reconfiguration..."

        # Reset configured flag to trigger hotspot
        if [ -f "$CONFIG_FILE" ]; then
            jq '.configured = false | .reconfiguration_needed = true | .reconfiguration_reason = "connectivity_failure"' \
                "$CONFIG_FILE" > "${CONFIG_FILE}.tmp"
            mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"
        fi

        # Start hotspot
        /opt/turnotec/scripts/hotspot_manager.sh start

        # Reset failure count
        FAILURE_COUNT=0

        log "Hotspot reactivated. Device needs reconfiguration."
    else
        log "Connectivity check failed ($FAILURE_COUNT/$MAX_FAILURES)"
    fi

    sleep "$CHECK_INTERVAL"
done
