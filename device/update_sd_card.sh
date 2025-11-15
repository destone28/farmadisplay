#!/bin/bash
###############################################################################
# TurnoTec - SD Card Update Script
# Updates WiFi PSK fix directly on Raspberry Pi SD card from Ubuntu PC
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=================================================="
echo "TurnoTec SD Card Update Script"
echo "WiFi PSK Fix Installation (via SD Card)"
echo "=================================================="
echo ""

# Check if running on Linux
if [ "$(uname)" != "Linux" ]; then
    echo -e "${RED}ERROR: This script must be run on Linux (Ubuntu)${NC}"
    exit 1
fi

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}ERROR: This script must be run as root (sudo)${NC}"
    echo "Usage: sudo $0 [SD_CARD_MOUNT_POINT]"
    echo ""
    echo "Example: sudo $0 /media/\$USER/rootfs"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}[1/7] Detecting SD card mount point...${NC}"

# Try to auto-detect SD card mount point
SD_MOUNT=""

if [ -n "$1" ]; then
    # User provided mount point
    SD_MOUNT="$1"
    echo "Using provided mount point: $SD_MOUNT"
else
    # Try common mount points
    POSSIBLE_MOUNTS=(
        "/media/$SUDO_USER/rootfs"
        "/media/$SUDO_USER/root"
        "/media/rootfs"
        "/mnt/sd-rootfs"
        "/mnt/raspberry"
    )

    for mount in "${POSSIBLE_MOUNTS[@]}"; do
        if [ -d "$mount/opt" ] && [ -d "$mount/etc" ]; then
            SD_MOUNT="$mount"
            echo -e "${GREEN}✓ Auto-detected SD card at: $SD_MOUNT${NC}"
            break
        fi
    done
fi

if [ -z "$SD_MOUNT" ] || [ ! -d "$SD_MOUNT" ]; then
    echo -e "${RED}ERROR: SD card mount point not found${NC}"
    echo ""
    echo "Please mount your Raspberry Pi SD card and run:"
    echo "  sudo $0 /path/to/sd/card/rootfs"
    echo ""
    echo "To find your SD card, run:"
    echo "  lsblk"
    echo "  ls -la /media/\$USER/"
    echo ""
    echo "Then mount it if needed:"
    echo "  sudo mkdir -p /mnt/sd-rootfs"
    echo "  sudo mount /dev/sdX2 /mnt/sd-rootfs  # Replace sdX with your SD device"
    exit 1
fi

# Validate it's a Raspberry Pi rootfs
if [ ! -d "$SD_MOUNT/opt" ] || [ ! -d "$SD_MOUNT/etc" ]; then
    echo -e "${RED}ERROR: $SD_MOUNT doesn't look like a Raspberry Pi rootfs${NC}"
    echo "Expected directories /opt and /etc not found"
    exit 1
fi

echo -e "${GREEN}✓ SD card found at: $SD_MOUNT${NC}"
echo ""

echo -e "${BLUE}[2/7] Verifying TurnoTec installation...${NC}"

if [ ! -d "$SD_MOUNT/opt/turnotec" ]; then
    echo -e "${RED}ERROR: TurnoTec not installed on this SD card${NC}"
    echo "Directory $SD_MOUNT/opt/turnotec not found"
    exit 1
fi

if [ ! -d "$SD_MOUNT/opt/turnotec/scripts" ]; then
    echo -e "${YELLOW}WARNING: Scripts directory doesn't exist, creating...${NC}"
    mkdir -p "$SD_MOUNT/opt/turnotec/scripts"
fi

echo -e "${GREEN}✓ TurnoTec installation found${NC}"
echo ""

echo -e "${BLUE}[3/7] Checking update files...${NC}"

# Check if update files exist
if [ ! -f "$SCRIPT_DIR/setup/scripts/generate_psk.py" ]; then
    echo -e "${RED}ERROR: generate_psk.py not found${NC}"
    echo "Expected location: $SCRIPT_DIR/setup/scripts/generate_psk.py"
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/setup/scripts/configure_device.sh" ]; then
    echo -e "${RED}ERROR: configure_device.sh not found${NC}"
    echo "Expected location: $SCRIPT_DIR/setup/scripts/configure_device.sh"
    exit 1
fi

# Verify configure_device.sh has the fix
if ! grep -q "generate_psk.py" "$SCRIPT_DIR/setup/scripts/configure_device.sh"; then
    echo -e "${RED}ERROR: configure_device.sh doesn't contain the WiFi fix${NC}"
    echo "Are you on the correct git branch?"
    exit 1
fi

echo -e "${GREEN}✓ Update files are ready${NC}"
echo ""

echo -e "${BLUE}[4/7] Backing up existing scripts...${NC}"

BACKUP_DIR="$SD_MOUNT/opt/turnotec/scripts.backup.$(date +%s)"
mkdir -p "$BACKUP_DIR"

if [ -f "$SD_MOUNT/opt/turnotec/scripts/configure_device.sh" ]; then
    cp "$SD_MOUNT/opt/turnotec/scripts/configure_device.sh" "$BACKUP_DIR/"
    echo "Backed up: configure_device.sh"
fi

if [ -f "$SD_MOUNT/opt/turnotec/scripts/generate_psk.py" ]; then
    cp "$SD_MOUNT/opt/turnotec/scripts/generate_psk.py" "$BACKUP_DIR/"
    echo "Backed up: generate_psk.py (if existed)"
fi

echo -e "${GREEN}✓ Backup created at: $(basename $BACKUP_DIR)${NC}"
echo ""

echo -e "${BLUE}[5/7] Installing updated scripts...${NC}"

# Copy generate_psk.py
echo "Installing: generate_psk.py"
cp "$SCRIPT_DIR/setup/scripts/generate_psk.py" "$SD_MOUNT/opt/turnotec/scripts/"
chmod 755 "$SD_MOUNT/opt/turnotec/scripts/generate_psk.py"
echo -e "${GREEN}✓ generate_psk.py installed${NC}"

# Copy configure_device.sh
echo "Installing: configure_device.sh"
cp "$SCRIPT_DIR/setup/scripts/configure_device.sh" "$SD_MOUNT/opt/turnotec/scripts/"
chmod 755 "$SD_MOUNT/opt/turnotec/scripts/configure_device.sh"
echo -e "${GREEN}✓ configure_device.sh updated${NC}"

echo ""

echo -e "${BLUE}[6/7] Verifying installation...${NC}"

# Check files exist
if [ ! -f "$SD_MOUNT/opt/turnotec/scripts/generate_psk.py" ]; then
    echo -e "${RED}✗ generate_psk.py not found after installation${NC}"
    exit 1
fi
echo -e "${GREEN}✓ generate_psk.py exists${NC}"

if [ ! -f "$SD_MOUNT/opt/turnotec/scripts/configure_device.sh" ]; then
    echo -e "${RED}✗ configure_device.sh not found after installation${NC}"
    exit 1
fi
echo -e "${GREEN}✓ configure_device.sh exists${NC}"

# Check if configure_device.sh has the fix
if grep -q "Generating secure PSK hash" "$SD_MOUNT/opt/turnotec/scripts/configure_device.sh"; then
    echo -e "${GREEN}✓ configure_device.sh contains WiFi PSK fix${NC}"
else
    echo -e "${RED}✗ configure_device.sh doesn't contain the fix${NC}"
    exit 1
fi

# Check shebang in generate_psk.py
if head -n 1 "$SD_MOUNT/opt/turnotec/scripts/generate_psk.py" | grep -q "python3"; then
    echo -e "${GREEN}✓ generate_psk.py has correct Python shebang${NC}"
else
    echo -e "${YELLOW}⚠ generate_psk.py shebang might be incorrect${NC}"
fi

echo ""

echo -e "${BLUE}[7/7] Installation summary...${NC}"
echo ""
echo "Files installed:"
echo "  • $SD_MOUNT/opt/turnotec/scripts/generate_psk.py"
echo "  • $SD_MOUNT/opt/turnotec/scripts/configure_device.sh"
echo ""
echo "Backup location:"
echo "  • $BACKUP_DIR/"
echo ""

# Show what's in the scripts directory
echo "Scripts directory contents:"
ls -lh "$SD_MOUNT/opt/turnotec/scripts/" | grep -E '\.(sh|py)$'
echo ""

echo "=================================================="
echo -e "${GREEN}✓ Update completed successfully!${NC}"
echo "=================================================="
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo ""
echo "1. Safely unmount the SD card:"
echo "   ${BLUE}sudo umount $SD_MOUNT${NC}"
echo ""
echo "2. Insert SD card back into Raspberry Pi"
echo ""
echo "3. Power on Raspberry Pi"
echo ""
echo "4. Connect to TurnoTec hotspot (SSID: TurnoTec, Password: Bacheca2025)"
echo ""
echo "5. Open browser: ${BLUE}http://192.168.4.1:8080/${NC}"
echo ""
echo "6. Configure WiFi with your credentials"
echo "   Display ID: ${BLUE}281224${NC}"
echo "   WiFi SSID: ${BLUE}Uaifai${NC}"
echo "   WiFi Password: ${BLUE}#QuestaQui23!${NC} (or your password)"
echo "   Domain: ${BLUE}turnotec.com${NC}"
echo ""
echo "7. Submit and wait for reboot"
echo ""
echo "8. WiFi should now connect successfully!"
echo ""
echo -e "${GREEN}The system will now properly handle passwords with special characters.${NC}"
echo ""

exit 0
