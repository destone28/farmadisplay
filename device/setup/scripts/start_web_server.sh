#!/bin/bash
###############################################################################
# TurnoTec - Web Server Starter
# Waits for hotspot to be ready, then starts Flask web server
###############################################################################

LOG_FILE="/var/log/turnotec-web.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "========================================="
log "TurnoTec Web Server Starting"
log "========================================="

# Wait for wlan0 interface to have IP 192.168.4.1
log "Waiting for wlan0 to have IP 192.168.4.1..."
RETRY=0
MAX_RETRIES=60  # 60 seconds

while [ $RETRY -lt $MAX_RETRIES ]; do
    if ip addr show wlan0 2>/dev/null | grep -q "192.168.4.1"; then
        log "✓ wlan0 has IP 192.168.4.1"
        break
    fi
    sleep 1
    RETRY=$((RETRY + 1))
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    log "ERROR: Timeout waiting for wlan0 IP address!"
    log "Current wlan0 status:"
    ip addr show wlan0 2>&1 | tee -a "$LOG_FILE"
    exit 1
fi

# Wait additional 2 seconds for network to stabilize
log "Waiting for network to stabilize..."
sleep 2

# Check if Flask is installed
if ! python3 -c "import flask" 2>/dev/null; then
    log "ERROR: Flask is not installed!"
    log "Installing Flask..."
    apt-get update -qq
    apt-get install -y python3-flask 2>&1 | tee -a "$LOG_FILE"
fi

# Check if port 80 is already in use
if netstat -tuln | grep -q ":80 "; then
    log "WARNING: Port 80 is already in use"
    netstat -tuln | grep ":80 " | tee -a "$LOG_FILE"
    log "Attempting to kill process on port 80..."
    fuser -k 80/tcp 2>&1 | tee -a "$LOG_FILE"
    sleep 1
fi

log "Starting Flask web server on 0.0.0.0:80..."
log "Working directory: /opt/turnotec/web"

# Change to web directory
cd /opt/turnotec/web || {
    log "ERROR: Cannot change to /opt/turnotec/web"
    exit 1
}

# Start Flask
log "Executing: python3 app.py"
exec python3 app.py 2>&1 | tee -a "$LOG_FILE"
