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

# Check for offline packages
PACKAGES_DIR="$SCRIPT_DIR/packages"
OFFLINE_INSTALL=false

if [ -d "$PACKAGES_DIR" ] && [ -n "$(ls -A $PACKAGES_DIR/*.deb 2>/dev/null)" ]; then
    PKG_COUNT=$(ls -1 "$PACKAGES_DIR"/*.deb 2>/dev/null | wc -l)
    echo "✓ Found $PKG_COUNT offline .deb packages"
    OFFLINE_INSTALL=true
else
    echo "⚠ No offline packages found - will use apt-get (requires internet)"
    OFFLINE_INSTALL=false
fi
echo ""

# Install required packages
echo "[1/8] Installing required packages..."

if [ "$OFFLINE_INSTALL" = true ]; then
    echo "Installing from offline .deb packages..."

    # Install packages with dpkg
    cd "$PACKAGES_DIR"

    # First pass: try to install all packages
    dpkg -i *.deb 2>/dev/null || true

    # Fix dependencies
    echo "Fixing dependencies..."
    apt-get install -f -y --no-install-recommends

    # Second pass: install any remaining packages
    dpkg -i *.deb 2>/dev/null || true

    echo "✓ Offline packages installed"
else
    echo "Downloading and installing packages..."

    # Ensure we have network before attempting
    if ! ping -c 1 8.8.8.8 &> /dev/null; then
        echo "ERROR: No internet connection available"
        echo "Either:"
        echo "  1. Connect Ethernet cable"
        echo "  2. Or use offline package installation (download packages first)"
        exit 1
    fi

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

    echo "✓ Packages installed from repositories"
fi

# Ensure dnsmasq and hostapd are stopped and disabled by default
systemctl stop dnsmasq hostapd 2>/dev/null || true
systemctl disable dnsmasq hostapd 2>/dev/null || true

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

# Configure FullPageOS
echo "[6/8] Configuring FullPageOS..."

# Configure initial display page in fullpageos.txt
if [ -f "$BOOT_PATH/fullpageos.txt" ]; then
    echo "Updating existing fullpageos.txt..."
    sed -i "s|^.*$|file:///opt/turnotec/web/templates/instructions.html|" "$BOOT_PATH/fullpageos.txt"
else
    echo "Creating fullpageos.txt..."
    echo "file:///opt/turnotec/web/templates/instructions.html" > "$BOOT_PATH/fullpageos.txt"
fi

echo "✓ FullPageOS configured (boot path: $BOOT_PATH)"
echo ""

# Configure initial display page
echo "[7/8] Configuring initial display page..."
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
  "version": "2.0.0",
  "configured": false,
  "offline_install": $OFFLINE_INSTALL,
  "boot_path": "$BOOT_PATH"
}
EOF

echo "========================================="
echo "Installation completed successfully!"
echo "========================================="
echo ""
echo "Installation Summary:"
echo "---------------------"
echo "  Installation method: $([ "$OFFLINE_INSTALL" = true ] && echo "Offline (.deb packages)" || echo "Online (apt-get)")"
echo "  FullPageOS boot path: $BOOT_PATH"
echo "  Systemd services: turnotec-hotspot, turnotec-monitor"
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
