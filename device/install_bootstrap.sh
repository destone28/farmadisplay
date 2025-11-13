#!/bin/bash
# FarmaDisplay - Bootstrap Installation Script for Raspberry Pi Zero 2 W
# This script installs the first boot configuration system

set -e

echo "🚀 Installing FarmaDisplay Bootstrap System..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}✗ Please run as root (sudo)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Running with root privileges${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo -e "${BLUE}Script directory: ${SCRIPT_DIR}${NC}"
echo ""

# Install system dependencies
echo -e "${YELLOW}📦 Installing system dependencies...${NC}"
apt-get update -qq
apt-get install -y \
    python3 \
    python3-pip \
    bluetooth \
    bluez \
    libbluetooth-dev \
    python3-dev \
    build-essential \
    network-manager \
    wireless-tools \
    wpasupplicant \
    rfkill

echo -e "${GREEN}✓ System dependencies installed${NC}"
echo ""

# Install Python packages
echo -e "${YELLOW}🐍 Installing Python packages...${NC}"
pip3 install --break-system-packages pybluez --no-cache-dir || pip3 install pybluez --no-cache-dir

echo -e "${GREEN}✓ Python packages installed${NC}"
echo ""

# Create directory structure
echo -e "${YELLOW}📁 Creating directory structure...${NC}"
mkdir -p /home/pi/.turnotec
mkdir -p /var/log
chown -R pi:pi /home/pi/.turnotec

echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Copy bootstrap scripts
echo -e "${YELLOW}📜 Installing bootstrap scripts...${NC}"

# Copy the three main scripts
cp "${SCRIPT_DIR}/scripts/first_boot_setup.py" /usr/local/bin/
cp "${SCRIPT_DIR}/scripts/bt_config_receiver.py" /usr/local/bin/
cp "${SCRIPT_DIR}/scripts/configure_fullpageos.py" /usr/local/bin/

# Make them executable
chmod +x /usr/local/bin/first_boot_setup.py
chmod +x /usr/local/bin/bt_config_receiver.py
chmod +x /usr/local/bin/configure_fullpageos.py

echo -e "${GREEN}✓ Bootstrap scripts installed:${NC}"
echo "  - /usr/local/bin/first_boot_setup.py"
echo "  - /usr/local/bin/bt_config_receiver.py"
echo "  - /usr/local/bin/configure_fullpageos.py"
echo ""

# Copy systemd service
echo -e "${YELLOW}🔧 Installing systemd service...${NC}"
cp "${SCRIPT_DIR}/systemd/farmadisplay-bootstrap.service" /etc/systemd/system/

echo -e "${GREEN}✓ Systemd service installed${NC}"
echo ""

# Enable Bluetooth
echo -e "${YELLOW}📡 Enabling Bluetooth...${NC}"
systemctl enable bluetooth
systemctl start bluetooth
rfkill unblock bluetooth

echo -e "${GREEN}✓ Bluetooth enabled${NC}"
echo ""

# Reload systemd
echo -e "${YELLOW}⚙️  Reloading systemd...${NC}"
systemctl daemon-reload

echo -e "${GREEN}✓ Systemd reloaded${NC}"
echo ""

# Enable bootstrap service
echo -e "${YELLOW}✅ Enabling bootstrap service...${NC}"
systemctl enable farmadisplay-bootstrap.service

echo -e "${GREEN}✓ Bootstrap service enabled${NC}"
echo ""

# Check if already configured
if [ -f "/home/pi/.turnotec/configured" ]; then
    echo -e "${YELLOW}⚠️  Device appears to be already configured${NC}"
    echo ""
    echo "Configuration file exists: /home/pi/.turnotec/configured"
    echo ""
    echo "To reconfigure the device:"
    echo "  1. Remove the configuration flag:"
    echo "     ${BLUE}sudo rm /home/pi/.turnotec/configured${NC}"
    echo "  2. Reboot the device:"
    echo "     ${BLUE}sudo reboot${NC}"
    echo ""
else
    echo -e "${YELLOW}📋 Bootstrap service status:${NC}"
    systemctl status farmadisplay-bootstrap.service --no-pager | head -n 10 || true
    echo ""
fi

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  ✅  BOOTSTRAP SYSTEM INSTALLED SUCCESSFULLY               ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📝 What happens on next boot:${NC}"
echo ""
echo "  1. 🔵 Bluetooth will be activated and made discoverable"
echo "  2. 📱 Device will wait for configuration from smartphone"
echo "  3. 📡 Configuration JSON will be received via Bluetooth"
echo "  4. ⚙️  WiFi and FullPageOS URL will be configured"
echo "  5. 🔄 Device will reboot and start displaying"
echo ""
echo -e "${YELLOW}📱 Configuration JSON format:${NC}"
echo ""
cat << 'EOF'
{
  "pharmacy_name": "Fior di Loto",
  "pharmacy_id": "c470809e-14be-42c0-ac9c-0d2e2914e33f",
  "display_id": "3ri8zb",
  "wifi_ssid": "your_wifi_ssid",
  "wifi_password": "your_wifi_password",
  "display_url": "https://yourdomain.com/display/3ri8zb",
  "generated_at": "2025-11-13T14:12:38.620820"
}
EOF
echo ""
echo -e "${YELLOW}🔧 Manual testing:${NC}"
echo ""
echo "  Test Bluetooth configuration server:"
echo "    ${BLUE}sudo python3 /usr/local/bin/bt_config_receiver.py${NC}"
echo ""
echo "  Check bootstrap service:"
echo "    ${BLUE}sudo systemctl status farmadisplay-bootstrap${NC}"
echo ""
echo "  View logs:"
echo "    ${BLUE}sudo tail -f /var/log/farmadisplay-bootstrap.log${NC}"
echo ""
echo -e "${YELLOW}🔄 To start first boot configuration:${NC}"
echo ""
if [ -f "/home/pi/.turnotec/configured" ]; then
    echo "  ${BLUE}sudo rm /home/pi/.turnotec/configured && sudo reboot${NC}"
else
    echo "  ${BLUE}sudo reboot${NC}"
fi
echo ""
echo -e "${GREEN}🎉 Installation complete!${NC}"
echo ""
