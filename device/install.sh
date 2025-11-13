#!/bin/bash
# TurnoTec Device Installation Script

set -e

echo "🚀 Installing TurnoTec Device Services..."

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

# Create TurnoTec directory
echo ""
echo -e "${YELLOW}📁 Creating TurnoTec directories...${NC}"
mkdir -p /home/pi/.turnotec
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
cp systemd/turnotec-network.service /etc/systemd/system/
cp systemd/turnotec-bt-config.service /etc/systemd/system/
cp systemd/turnotec-watchdog.service /etc/systemd/system/

echo -e "${GREEN}✓ Systemd services installed${NC}"

# Enable services
echo ""
echo -e "${YELLOW}⚙️  Enabling services...${NC}"
systemctl daemon-reload
systemctl enable turnotec-network
systemctl enable turnotec-bt-config
systemctl enable turnotec-watchdog

echo -e "${GREEN}✓ Services enabled${NC}"

# Start services
echo ""
echo -e "${YELLOW}▶️  Starting services...${NC}"
systemctl start turnotec-network
systemctl start turnotec-bt-config
systemctl start turnotec-watchdog

echo -e "${GREEN}✓ Services started${NC}"

# Check service status
echo ""
echo -e "${YELLOW}📊 Service Status:${NC}"
echo ""
systemctl status turnotec-network --no-pager | head -n 5
echo ""
systemctl status turnotec-bt-config --no-pager | head -n 5
echo ""
systemctl status turnotec-watchdog --no-pager | head -n 5

echo ""
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "  1. Set device ID: echo 'YOUR_DEVICE_ID' > /home/pi/.turnotec/device_id"
echo "  2. Configure WiFi via Bluetooth using the mobile app"
echo "  3. Check logs: tail -f /var/log/turnotec-*.log"
echo "  4. Check service status: sudo systemctl status turnotec-*"
echo ""
echo -e "${GREEN}🎉 TurnoTec device is ready!${NC}"
