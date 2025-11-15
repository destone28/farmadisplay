#!/bin/bash
#
# TurnoTec Agent Update Script
#
# Updates the TurnoTec agent from the latest version
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/turnotec/update.log"

# Setup logging
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

echo "=========================================="
echo "TurnoTec Agent Update"
echo "Started: $(date)"
echo "=========================================="

# Stop the agent service
echo "Stopping TurnoTec agent..."
systemctl stop turnotec-agent || true

# Backup current agent
echo "Backing up current agent..."
if [ -f "/opt/turnotec/agent/turnotec_agent.py" ]; then
    cp /opt/turnotec/agent/turnotec_agent.py /opt/turnotec/agent/turnotec_agent.py.bak
fi

# Update from repository (if configured)
# For now, just reinstall dependencies
echo "Updating Python dependencies..."
pip3 install --upgrade -r /opt/turnotec/agent/requirements.txt

# Set permissions
echo "Setting permissions..."
chmod +x /opt/turnotec/agent/turnotec_agent.py

# Restart the agent service
echo "Restarting TurnoTec agent..."
systemctl start turnotec-agent

# Check status
sleep 2
if systemctl is-active --quiet turnotec-agent; then
    echo "✓ Agent update completed successfully"
    echo "Status: $(systemctl status turnotec-agent --no-pager -l | head -3)"
    exit 0
else
    echo "✗ Agent failed to start after update"
    echo "Restoring backup..."
    if [ -f "/opt/turnotec/agent/turnotec_agent.py.bak" ]; then
        cp /opt/turnotec/agent/turnotec_agent.py.bak /opt/turnotec/agent/turnotec_agent.py
        systemctl start turnotec-agent
    fi
    exit 1
fi
