#!/bin/bash
# Memory Monitor for Raspberry Pi
# Monitors memory usage and restarts chromium if needed

LOG_FILE="/var/log/farmadisplay-memory.log"
MEMORY_THRESHOLD=85  # Restart if memory usage exceeds this percentage

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

get_memory_usage() {
    free | grep Mem | awk '{print ($3/$2) * 100.0}'
}

restart_chromium() {
    log_message "Memory usage critical, restarting Chromium..."
    pkill -f chromium
    sleep 2
    # FullPageOS will automatically restart Chromium
    log_message "Chromium restart triggered"
}

# Main monitoring loop
while true; do
    MEMORY_USAGE=$(get_memory_usage)
    MEMORY_INT=${MEMORY_USAGE%.*}

    if [ "$MEMORY_INT" -gt "$MEMORY_THRESHOLD" ]; then
        log_message "WARNING: Memory usage at ${MEMORY_USAGE}%"
        restart_chromium
        # Wait 5 minutes after restart before checking again
        sleep 300
    fi

    # Check every 60 seconds
    sleep 60
done
