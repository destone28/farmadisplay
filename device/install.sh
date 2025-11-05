#!/bin/bash
# FarmaDisplay Device Installation Script

set -e

echo "🚀 Installing FarmaDisplay Device Services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Running with root privileges${NC}"

# Install system dependencies
echo ""
echo -e "${YELLOW}📦 Installing system dependencies...${NC}"
apt-get update
apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    bluetooth \
    libbluetooth-dev \
    python3-dev \
    build-essential \
    network-manager \
    wireless-tools \
    wpasupplicant

echo -e "${GREEN}✓ System dependencies installed${NC}"

# Install Python packages
echo ""
echo -e "${YELLOW}🐍 Installing Python packages...${NC}"
pip3 install --break-system-packages pybluez requests --no-cache-dir

echo -e "${GREEN}✓ Python packages installed${NC}"

# Create FarmaDisplay directory
echo ""
echo -e "${YELLOW}📁 Creating FarmaDisplay directories...${NC}"
mkdir -p /home/pi/.farmadisplay
mkdir -p /var/log

echo -e "${GREEN}✓ Directories created${NC}"

# Copy scripts
echo ""
echo -e "${YELLOW}📜 Installing scripts...${NC}"
cp scripts/network_healing_daemon.py /usr/local/bin/
cp scripts/bt_wifi_config_server.py /usr/local/bin/
cp scripts/memory_monitor.sh /usr/local/bin/
chmod +x /usr/local/bin/network_healing_daemon.py
chmod +x /usr/local/bin/bt_wifi_config_server.py
chmod +x /usr/local/bin/memory_monitor.sh

echo -e "${GREEN}✓ Scripts installed${NC}"

# Copy systemd services
echo ""
echo -e "${YELLOW}🔧 Installing systemd services...${NC}"
cp systemd/farmadisplay-network.service /etc/systemd/system/
cp systemd/farmadisplay-bt-config.service /etc/systemd/system/
cp systemd/farmadisplay-watchdog.service /etc/systemd/system/

echo -e "${GREEN}✓ Systemd services installed${NC}"

# Enable services
echo ""
echo -e "${YELLOW}⚙️  Enabling services...${NC}"
systemctl daemon-reload
systemctl enable farmadisplay-network
systemctl enable farmadisplay-bt-config
systemctl enable farmadisplay-watchdog

echo -e "${GREEN}✓ Services enabled${NC}"

# Start services
echo ""
echo -e "${YELLOW}▶️  Starting services...${NC}"
systemctl start farmadisplay-network
systemctl start farmadisplay-bt-config
systemctl start farmadisplay-watchdog

echo -e "${GREEN}✓ Services started${NC}"

# Check service status
echo ""
echo -e "${YELLOW}📊 Service Status:${NC}"
echo ""
systemctl status farmadisplay-network --no-pager | head -n 5
echo ""
systemctl status farmadisplay-bt-config --no-pager | head -n 5
echo ""
systemctl status farmadisplay-watchdog --no-pager | head -n 5

echo ""
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "  1. Set device ID: echo 'YOUR_DEVICE_ID' > /home/pi/.farmadisplay/device_id"
echo "  2. Configure WiFi via Bluetooth using the mobile app"
echo "  3. Check logs: tail -f /var/log/farmadisplay-*.log"
echo "  4. Check service status: sudo systemctl status farmadisplay-*"
echo ""
echo -e "${GREEN}🎉 FarmaDisplay device is ready!${NC}"
