#!/bin/bash
# FarmaDisplay - SD Card Preparation Script
# Prepares a FullPageOS SD card with bootstrap system pre-installed
# Run this script on Linux/Mac with the SD card mounted

set -e

echo "🚀 FarmaDisplay - SD Card Preparation Script"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}✗ Please run as root (sudo)${NC}"
    echo "Usage: sudo bash prepare_sd_card.sh /path/to/sd/card/root"
    exit 1
fi

# Check arguments
if [ "$#" -ne 1 ]; then
    echo -e "${RED}✗ Missing SD card root path${NC}"
    echo ""
    echo "Usage: sudo bash prepare_sd_card.sh /path/to/sd/card/root"
    echo ""
    echo "Examples:"
    echo "  Linux:   sudo bash prepare_sd_card.sh /media/user/rootfs"
    echo "  Mac:     sudo bash prepare_sd_card.sh /Volumes/rootfs"
    echo ""
    exit 1
fi

SD_ROOT="$1"

# Validate SD card root path
if [ ! -d "$SD_ROOT" ]; then
    echo -e "${RED}✗ SD card root path does not exist: $SD_ROOT${NC}"
    exit 1
fi

if [ ! -d "$SD_ROOT/etc" ] || [ ! -d "$SD_ROOT/usr" ]; then
    echo -e "${RED}✗ This doesn't look like a Linux root filesystem${NC}"
    echo -e "${RED}Make sure you're pointing to the rootfs partition, not boot${NC}"
    exit 1
fi

echo -e "${GREEN}✓ SD card root path validated: $SD_ROOT${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if we're in the device directory
if [ ! -f "$SCRIPT_DIR/install_bootstrap.sh" ]; then
    echo -e "${RED}✗ This script must be run from the device/ directory${NC}"
    exit 1
fi

echo -e "${BLUE}📁 Script directory: $SCRIPT_DIR${NC}"
echo ""

# Step 1: Copy bootstrap scripts
echo -e "${YELLOW}📜 Copying bootstrap scripts...${NC}"

mkdir -p "$SD_ROOT/usr/local/bin"

cp "$SCRIPT_DIR/scripts/first_boot_setup.py" "$SD_ROOT/usr/local/bin/"
cp "$SCRIPT_DIR/scripts/bt_config_receiver.py" "$SD_ROOT/usr/local/bin/"
cp "$SCRIPT_DIR/scripts/configure_fullpageos.py" "$SD_ROOT/usr/local/bin/"

chmod +x "$SD_ROOT/usr/local/bin/first_boot_setup.py"
chmod +x "$SD_ROOT/usr/local/bin/bt_config_receiver.py"
chmod +x "$SD_ROOT/usr/local/bin/configure_fullpageos.py"

echo -e "${GREEN}✓ Bootstrap scripts copied to /usr/local/bin/${NC}"
echo ""

# Step 2: Copy systemd service
echo -e "${YELLOW}🔧 Installing systemd service...${NC}"

mkdir -p "$SD_ROOT/etc/systemd/system"
cp "$SCRIPT_DIR/systemd/farmadisplay-bootstrap.service" "$SD_ROOT/etc/systemd/system/"

echo -e "${GREEN}✓ Systemd service installed${NC}"
echo ""

# Step 3: Enable systemd service (create symlink)
echo -e "${YELLOW}⚙️  Enabling bootstrap service...${NC}"

mkdir -p "$SD_ROOT/etc/systemd/system/multi-user.target.wants"
ln -sf /etc/systemd/system/farmadisplay-bootstrap.service \
       "$SD_ROOT/etc/systemd/system/multi-user.target.wants/farmadisplay-bootstrap.service"

echo -e "${GREEN}✓ Bootstrap service enabled${NC}"
echo ""

# Step 4: Create .turnotec directory
echo -e "${YELLOW}📁 Creating configuration directory...${NC}"

mkdir -p "$SD_ROOT/home/pi/.turnotec"
chown -R 1000:1000 "$SD_ROOT/home/pi/.turnotec" 2>/dev/null || true
chmod 755 "$SD_ROOT/home/pi/.turnotec"

echo -e "${GREEN}✓ Configuration directory created${NC}"
echo ""

# Step 5: Create install script for dependencies (will run on first boot)
echo -e "${YELLOW}📦 Creating dependency installer...${NC}"

cat > "$SD_ROOT/usr/local/bin/install_bootstrap_dependencies.sh" << 'EOF'
#!/bin/bash
# Auto-install dependencies on first boot

DONE_FLAG="/home/pi/.turnotec/deps_installed"

if [ -f "$DONE_FLAG" ]; then
    exit 0
fi

apt-get update -qq
apt-get install -y \
    python3 \
    python3-pip \
    bluetooth \
    bluez \
    libbluetooth-dev \
    python3-dev \
    build-essential \
    rfkill \
    wireless-tools \
    wpasupplicant

pip3 install --break-system-packages pybluez --no-cache-dir || pip3 install pybluez --no-cache-dir

# Enable Bluetooth
systemctl enable bluetooth
systemctl start bluetooth
rfkill unblock bluetooth

# Mark as done
touch "$DONE_FLAG"
EOF

chmod +x "$SD_ROOT/usr/local/bin/install_bootstrap_dependencies.sh"

echo -e "${GREEN}✓ Dependency installer created${NC}"
echo ""

# Step 6: Create systemd service for dependency installation
echo -e "${YELLOW}🔧 Creating dependency installer service...${NC}"

cat > "$SD_ROOT/etc/systemd/system/farmadisplay-deps-install.service" << 'EOF'
[Unit]
Description=FarmaDisplay Bootstrap Dependencies Installer
Before=farmadisplay-bootstrap.service
After=network.target
ConditionPathExists=!/home/pi/.turnotec/deps_installed

[Service]
Type=oneshot
ExecStart=/usr/local/bin/install_bootstrap_dependencies.sh
RemainAfterExit=yes
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Enable dependency installer service
ln -sf /etc/systemd/system/farmadisplay-deps-install.service \
       "$SD_ROOT/etc/systemd/system/multi-user.target.wants/farmadisplay-deps-install.service"

echo -e "${GREEN}✓ Dependency installer service created and enabled${NC}"
echo ""

# Step 7: Enable SSH (optional but recommended)
echo -e "${YELLOW}🔐 Enabling SSH...${NC}"

# Find boot partition (usually mounted alongside rootfs)
BOOT_PARTITION=""
if [ -d "$SD_ROOT/../boot" ]; then
    BOOT_PARTITION="$SD_ROOT/../boot"
elif [ -d "$SD_ROOT/boot" ]; then
    BOOT_PARTITION="$SD_ROOT/boot"
fi

if [ -n "$BOOT_PARTITION" ]; then
    touch "$BOOT_PARTITION/ssh"
    echo -e "${GREEN}✓ SSH enabled (created /boot/ssh file)${NC}"
else
    echo -e "${YELLOW}⚠ Could not find boot partition, SSH not enabled${NC}"
    echo -e "${YELLOW}  You can enable it manually by creating an empty 'ssh' file in the boot partition${NC}"
fi
echo ""

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}║  ✅  SD CARD PREPARATION COMPLETED SUCCESSFULLY        ║${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📋 Files installed on SD card:${NC}"
echo ""
echo "  ✓ /usr/local/bin/first_boot_setup.py"
echo "  ✓ /usr/local/bin/bt_config_receiver.py"
echo "  ✓ /usr/local/bin/configure_fullpageos.py"
echo "  ✓ /usr/local/bin/install_bootstrap_dependencies.sh"
echo "  ✓ /etc/systemd/system/farmadisplay-bootstrap.service (enabled)"
echo "  ✓ /etc/systemd/system/farmadisplay-deps-install.service (enabled)"
echo "  ✓ /home/pi/.turnotec/ (directory)"
if [ -n "$BOOT_PARTITION" ]; then
    echo "  ✓ /boot/ssh (SSH enabled)"
fi
echo ""
echo -e "${YELLOW}🚀 Next steps:${NC}"
echo ""
echo "  1. Safely eject the SD card"
echo "  2. Insert into Raspberry Pi Zero 2 W"
echo "  3. Connect HDMI display and power"
echo "  4. Wait for first boot (5-10 minutes)"
echo "  5. System will:"
echo "     • Install dependencies automatically"
echo "     • Enable Bluetooth"
echo "     • Become discoverable as 'FarmaDisplay Setup'"
echo "     • Wait for configuration from smartphone"
echo ""
echo -e "${YELLOW}📱 To configure:${NC}"
echo ""
echo "  1. Install 'Serial Bluetooth Terminal' on Android"
echo "  2. Scan for devices → Connect to 'FarmaDisplay Setup'"
echo "  3. Send configuration JSON from dashboard"
echo "  4. Device will configure WiFi and URL automatically"
echo "  5. Device will reboot and start displaying"
echo ""
echo -e "${GREEN}🎉 SD card is ready!${NC}"
echo ""
