#!/bin/bash
###############################################################################
# TurnoTec Device Setup - Installation Script
# Run this script on a fresh FullPageOS installation
#
# Usage:
#   sudo ./install.sh              # Interactive mode
#   sudo ./install.sh --auto-confirm  # Auto-confirm mode (no prompts)
###############################################################################

set -e

# Parse arguments
AUTO_CONFIRM=false
if [ "$1" = "--auto-confirm" ]; then
    AUTO_CONFIRM=true
fi

echo "========================================="
echo "TurnoTec Device Setup - Installation"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "ERROR: This script must be run as root"
    echo "Please run: sudo $0"
    exit 1
fi

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    echo "WARNING: This doesn't appear to be a Raspberry Pi"
    if [ "$AUTO_CONFIRM" = false ]; then
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo "Auto-confirm mode: continuing anyway"
    fi
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Installation directory: $SCRIPT_DIR"
echo ""

# Install required packages
echo "[1/8] Installing required packages..."
apt-get update -qq
apt-get install -y \
    hostapd \
    dnsmasq \
    python3-flask \
    python3-pip \
    jq \
    wireless-tools \
    iw \
    curl \
    net-tools

# Ensure dnsmasq and hostapd are stopped and disabled by default
systemctl stop dnsmasq hostapd 2>/dev/null || true
systemctl disable dnsmasq hostapd 2>/dev/null || true

echo "✓ Packages installed"
echo ""

# Create directory structure
echo "[2/8] Creating directory structure..."
mkdir -p /opt/turnotec/{scripts,web/templates,web/static}
mkdir -p /var/log/turnotec
chmod 755 /opt/turnotec
echo "✓ Directories created"
echo ""

# Copy scripts
echo "[3/8] Copying scripts..."
cp "$SCRIPT_DIR/setup/scripts/"*.sh /opt/turnotec/scripts/
chmod +x /opt/turnotec/scripts/*.sh
echo "✓ Scripts copied"
echo ""

# Copy web application
echo "[4/8] Copying web application..."
cp "$SCRIPT_DIR/setup/web/app.py" /opt/turnotec/web/
cp "$SCRIPT_DIR/setup/web/templates/"*.html /opt/turnotec/web/templates/
chmod 644 /opt/turnotec/web/templates/*.html
echo "✓ Web application copied"
echo ""

# Copy systemd services
echo "[5/8] Installing systemd services..."
cp "$SCRIPT_DIR/setup/systemd/"*.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable turnotec-hotspot.service
systemctl enable turnotec-monitor.service
echo "✓ Systemd services installed"
echo ""

# Configure Chromium flags
echo "[6/8] Configuring Chromium..."

# Copy chromium flags to boot partition
if [ -d /boot ]; then
    cp "$SCRIPT_DIR/config/chromium-flags.txt" /boot/
    echo "✓ Chromium flags copied to /boot/"
else
    echo "⚠ WARNING: /boot directory not found, skipping chromium-flags.txt"
fi

# Copy FullPageOS template
cp "$SCRIPT_DIR/config/fullpageos-template.txt" /boot/fullpageos.txt 2>/dev/null || \
    echo "⚠ WARNING: Could not copy fullpageos.txt to /boot"

echo "✓ Chromium configured"
echo ""

# Configure initial display page
echo "[7/8] Configuring initial display page..."

# Ensure instructions.html is served initially
if [ -f /boot/fullpageos.txt ]; then
    sed -i 's|^FULLPAGEOS_URL=.*|FULLPAGEOS_URL=file:///opt/turnotec/web/templates/instructions.html|' /boot/fullpageos.txt
fi

echo "✓ Initial display page configured"
echo ""

# Set permissions
echo "[8/8] Setting permissions..."
chown -R root:root /opt/turnotec
chmod -R 755 /opt/turnotec/scripts
chmod 644 /opt/turnotec/web/app.py
echo "✓ Permissions set"
echo ""

# Create initial state
echo "Creating initial state..."
cat > /opt/turnotec/state.json <<EOF
{
  "installed_at": "$(date -Iseconds)",
  "version": "1.0.0",
  "configured": false
}
EOF

echo "========================================="
echo "Installation completed successfully!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Reboot the device: sudo reboot"
echo "2. The device will show configuration instructions on screen"
echo "3. Connect your smartphone to WiFi: TurnoTec"
echo "4. Visit http://192.168.4.1 from your smartphone"
echo "5. Complete the configuration form"
echo ""
echo "The device will automatically reboot and display the configured page."
echo ""

if [ "$AUTO_CONFIRM" = false ]; then
    read -p "Reboot now? (Y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        echo "Rebooting in 3 seconds..."
        sleep 3
        reboot
    else
        echo "Please reboot manually when ready: sudo reboot"
    fi
else
    echo "Auto-confirm mode: skipping reboot prompt"
    echo "System will reboot on next scheduled reboot"
fi
