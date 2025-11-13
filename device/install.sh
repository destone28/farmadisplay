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

# Detect FullPageOS boot path
BOOT_PATH="/boot"
if [ -f "$SCRIPT_DIR/boot_path.txt" ]; then
    BOOT_PATH=$(cat "$SCRIPT_DIR/boot_path.txt")
    echo "Using detected boot path: $BOOT_PATH"
elif [ -d "/boot/firmware" ]; then
    BOOT_PATH="/boot/firmware"
    echo "Detected boot path: $BOOT_PATH (Bookworm+)"
else
    echo "Using default boot path: $BOOT_PATH (Legacy)"
fi
echo ""

# Check internet connectivity
echo "Checking internet connectivity..."
if ! ping -c 1 -W 5 8.8.8.8 &> /dev/null; then
    echo "ERROR: No internet connection!"
    echo ""
    echo "Please ensure:"
    echo "  1. Ethernet cable is connected"
    echo "  2. Network has internet access"
    echo ""
    echo "Aborting installation."
    exit 1
fi
echo "✓ Internet connection OK"
echo ""

# Install required packages
echo "[1/8] Installing required packages..."
echo "This may take 5-10 minutes depending on network speed..."

# Update package lists
apt-get update -qq

# Install packages
apt-get install -y --no-install-recommends \
    hostapd \
    dnsmasq \
    python3-flask \
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
cp "$SCRIPT_DIR/setup/systemd/turnotec-"*.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable turnotec-hotspot.service
systemctl enable turnotec-monitor.service
echo "✓ Systemd services installed"
echo ""

# Configure FullPageOS
echo "[6/8] Configuring FullPageOS..."

# Configure initial display page in fullpageos.txt
if [ -f "$BOOT_PATH/fullpageos.txt" ]; then
    echo "Updating fullpageos.txt..."
    echo "file:///opt/turnotec/web/templates/instructions.html" > "$BOOT_PATH/fullpageos.txt"
else
    echo "Creating fullpageos.txt..."
    echo "file:///opt/turnotec/web/templates/instructions.html" > "$BOOT_PATH/fullpageos.txt"
fi

echo "✓ FullPageOS configured (boot path: $BOOT_PATH)"
echo ""

# Set permissions
echo "[7/8] Setting permissions..."
chown -R root:root /opt/turnotec
chmod -R 755 /opt/turnotec/scripts
chmod 644 /opt/turnotec/web/app.py
echo "✓ Permissions set"
echo ""

# Create initial state
echo "[8/8] Creating initial state..."
cat > /opt/turnotec/state.json <<EOF
{
  "installed_at": "$(date -Iseconds)",
  "version": "3.0.0",
  "configured": false,
  "boot_path": "$BOOT_PATH"
}
EOF
echo "✓ State file created"
echo ""

echo "========================================="
echo "Installation completed successfully!"
echo "========================================="
echo ""
echo "Installation Summary:"
echo "---------------------"
echo "  FullPageOS boot path: $BOOT_PATH"
echo "  Systemd services: turnotec-hotspot, turnotec-monitor"
echo "  Configuration file: $BOOT_PATH/fullpageos.txt"
echo ""
echo "Next steps:"
echo "1. System will reboot automatically"
echo "2. The display will show configuration instructions"
echo "3. Connect smartphone to WiFi: TurnoTec (password: Bacheca2025)"
echo "4. Visit http://192.168.4.1 from smartphone"
echo "5. Complete the configuration form"
echo ""

if [ "$AUTO_CONFIRM" = false ]; then
    read -p "Reboot now? (Y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        echo "Rebooting in 3 seconds..."
        sleep 3
        reboot
    else
        echo "Please reboot manually: sudo reboot"
    fi
else
    echo "Auto-confirm mode: rebooting in 5 seconds..."
    sleep 5
    reboot
fi
