#!/bin/bash
###############################################################################
# TurnoTec - SD Card Preparation Script (Linux/Mac)
# Prepares a FullPageOS SD card with TurnoTec system from PC
# For Ubuntu 24.04 LTS and compatible systems
###############################################################################

set -e

echo "========================================="
echo "TurnoTec - SD Card Preparation"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root (needed for mount operations)
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}ERROR: This script must be run as root${NC}"
    echo "Please run: sudo $0"
    exit 1
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGES_DIR="$SCRIPT_DIR/packages"

echo -e "${GREEN}Script directory: $SCRIPT_DIR${NC}"
echo ""

# Check for ARM packages
if [ -d "$PACKAGES_DIR" ] && [ -n "$(ls -A $PACKAGES_DIR/*.deb 2>/dev/null)" ]; then
    PKG_COUNT=$(ls -1 "$PACKAGES_DIR"/*.deb 2>/dev/null | wc -l)
    echo -e "${GREEN}✓ Found $PKG_COUNT ARM .deb packages${NC}"
    echo -e "${GREEN}  Installation will be OFFLINE (no internet needed)${NC}"
    OFFLINE_MODE=true
else
    echo -e "${YELLOW}⚠ No ARM packages found in packages/${NC}"
    echo -e "${YELLOW}  Installation will require Ethernet connection${NC}"
    echo ""
    echo "To enable offline installation:"
    echo "  1. Run: ./download_packages_arm.sh"
    echo "  2. Then run this script again"
    echo ""
    read -p "Continue with online installation? (yes/no): " CONFIRM_ONLINE
    if [ "$CONFIRM_ONLINE" != "yes" ]; then
        echo "Aborted. Please download ARM packages first."
        exit 1
    fi
    OFFLINE_MODE=false
fi
echo ""

# Detect OS
OS_TYPE="$(uname -s)"
echo -e "${GREEN}Detected OS: $OS_TYPE${NC}"
echo ""

# Find SD card
echo "========================================="
echo "Step 1: Detect SD Card"
echo "========================================="
echo ""

if [ "$OS_TYPE" = "Darwin" ]; then
    # macOS
    echo "Available disks:"
    diskutil list | grep -E "(disk[0-9]+|external|physical)"
    echo ""
    read -p "Enter SD card device (e.g., disk2): " SD_DEVICE
    SD_DEVICE="/dev/${SD_DEVICE}"
    BOOT_MOUNT="/Volumes/bootfs"
    ROOTFS_MOUNT="/Volumes/rootfs"
else
    # Linux
    echo "Available disks:"
    lsblk -d -o NAME,SIZE,TYPE,MOUNTPOINT | grep -E "sd|mmcblk"
    echo ""
    read -p "Enter SD card device (e.g., sdb or mmcblk0): " SD_DEVICE
    SD_DEVICE="/dev/${SD_DEVICE}"
    BOOT_MOUNT="/mnt/turnotec_boot"
    ROOTFS_MOUNT="/mnt/turnotec_rootfs"
fi

# Verify SD card
echo ""
echo -e "${YELLOW}WARNING: This will prepare ${SD_DEVICE}${NC}"
echo -e "${YELLOW}Make sure FullPageOS is already flashed on this SD card!${NC}"
echo ""
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

# Detect partitions
echo ""
echo "========================================="
echo "Step 2: Mount Partitions"
echo "========================================="
echo ""

if [ "$OS_TYPE" = "Darwin" ]; then
    # macOS
    BOOT_PARTITION="${SD_DEVICE}s1"
    ROOTFS_PARTITION="${SD_DEVICE}s2"

    # Unmount if already mounted
    diskutil unmountDisk "$SD_DEVICE" 2>/dev/null || true

    # Mount partitions (macOS auto-mounts, just wait)
    echo "Please wait while macOS mounts the partitions..."
    sleep 3

    # Check if mounted (try both names)
    if [ -d "/Volumes/bootfs" ]; then
        BOOT_MOUNT="/Volumes/bootfs"
    elif [ -d "/Volumes/boot" ]; then
        BOOT_MOUNT="/Volumes/boot"
    fi

    if [ ! -d "$BOOT_MOUNT" ] || [ ! -d "$ROOTFS_MOUNT" ]; then
        echo -e "${RED}ERROR: Partitions not auto-mounted${NC}"
        echo "Trying manual mount..."
        mkdir -p "$BOOT_MOUNT" "$ROOTFS_MOUNT"
        mount -t msdos "$BOOT_PARTITION" "$BOOT_MOUNT"
        mount -t ext4 "$ROOTFS_PARTITION" "$ROOTFS_MOUNT"
    fi
else
    # Linux
    if [[ "$SD_DEVICE" == *"mmcblk"* ]]; then
        BOOT_PARTITION="${SD_DEVICE}p1"
        ROOTFS_PARTITION="${SD_DEVICE}p2"
    else
        BOOT_PARTITION="${SD_DEVICE}1"
        ROOTFS_PARTITION="${SD_DEVICE}2"
    fi

    # Create mount points
    mkdir -p "$BOOT_MOUNT" "$ROOTFS_MOUNT"

    # Unmount if already mounted
    umount "$BOOT_PARTITION" 2>/dev/null || true
    umount "$ROOTFS_PARTITION" 2>/dev/null || true

    # Mount partitions
    mount "$BOOT_PARTITION" "$BOOT_MOUNT"
    mount "$ROOTFS_PARTITION" "$ROOTFS_MOUNT"
fi

echo -e "${GREEN}✓ Partitions mounted:${NC}"
echo "  Boot: $BOOT_MOUNT"
echo "  Root: $ROOTFS_MOUNT"
echo ""

# Verify FullPageOS
if [ ! -f "$ROOTFS_MOUNT/etc/os-release" ]; then
    echo -e "${RED}ERROR: This doesn't look like a valid Linux SD card${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Valid Linux filesystem detected${NC}"

# Detect FullPageOS boot path (/boot vs /boot/firmware)
echo ""
echo "Detecting FullPageOS version..."

FULLPAGEOS_BOOT_PATH="/boot"
if [ -d "$ROOTFS_MOUNT/boot/firmware" ]; then
    FULLPAGEOS_BOOT_PATH="/boot/firmware"
    echo -e "${GREEN}✓ Detected FullPageOS with /boot/firmware (Bookworm+)${NC}"
else
    echo -e "${GREEN}✓ Detected FullPageOS with /boot (Legacy)${NC}"
fi

echo ""

# Copy files
echo "========================================="
echo "Step 3: Copy TurnoTec Files"
echo "========================================="
echo ""

# Create directories on SD card
echo "Creating directories..."
mkdir -p "$ROOTFS_MOUNT/opt/turnotec/"{scripts,web/templates,web/static}
mkdir -p "$ROOTFS_MOUNT/opt/turnotec-installer"
mkdir -p "$ROOTFS_MOUNT/var/log/turnotec"

# Copy all device files to installer directory
echo "Copying installation files..."
cp -r "$SCRIPT_DIR/setup" "$ROOTFS_MOUNT/opt/turnotec-installer/"
cp -r "$SCRIPT_DIR/config" "$ROOTFS_MOUNT/opt/turnotec-installer/"
cp "$SCRIPT_DIR/install.sh" "$ROOTFS_MOUNT/opt/turnotec-installer/"

echo -e "${GREEN}✓ Files copied to /opt/turnotec-installer/${NC}"
echo ""

# Copy ARM packages if available
if [ "$OFFLINE_MODE" = true ]; then
    echo "Copying ARM packages..."
    mkdir -p "$ROOTFS_MOUNT/opt/turnotec-installer/packages"
    cp "$PACKAGES_DIR"/*.deb "$ROOTFS_MOUNT/opt/turnotec-installer/packages/"

    PKG_COPIED=$(ls -1 "$ROOTFS_MOUNT/opt/turnotec-installer/packages"/*.deb 2>/dev/null | wc -l)
    echo -e "${GREEN}✓ Copied $PKG_COPIED ARM .deb packages${NC}"

    # Verify architecture
    SAMPLE_DEB=$(ls "$ROOTFS_MOUNT/opt/turnotec-installer/packages"/*.deb | head -1)
    ARCH=$(dpkg --info "$SAMPLE_DEB" 2>/dev/null | grep "Architecture:" | awk '{print $2}' || echo "unknown")
    echo -e "${GREEN}✓ Package architecture: $ARCH${NC}"
    echo ""
fi

# Configure boot partition
echo "========================================="
echo "Step 4: Configure Boot Partition"
echo "========================================="
echo ""

# Configure FullPageOS to open waiting page
echo "Configuring FullPageOS..."
echo "file:///opt/turnotec/web/templates/waiting.html" > "$BOOT_MOUNT/fullpageos.txt"

echo -e "${GREEN}✓ FullPageOS configured to show waiting page${NC}"

# Enable SSH
echo "Enabling SSH..."
touch "$BOOT_MOUNT/ssh"
echo -e "${GREEN}✓ SSH enabled${NC}"

# Configure WiFi country (required to unblock rfkill)
echo "Configuring WiFi country (Italy)..."
cat >> "$BOOT_MOUNT/config.txt" <<'EOF'

# WiFi Country Configuration (required for WiFi/hotspot)
dtparam=country=IT
EOF

echo -e "${GREEN}✓ WiFi country set to IT${NC}"

echo ""

# Create first-boot installation script
echo "========================================="
echo "Step 5: Create First-Boot Installer"
echo "========================================="
echo ""

cat > "$ROOTFS_MOUNT/opt/turnotec-installer/first_boot_install.sh" <<FIRSTBOOT
#!/bin/bash
###############################################################################
# TurnoTec - First Boot Installation Script
###############################################################################

LOGFILE="/var/log/turnotec-first-boot.log"

log() {
    echo "[\$(date '+%Y-%m-%d %H:%M:%S')] \$1" | tee -a "\$LOGFILE"
}

log "========================================="
log "TurnoTec First Boot Installation Started"
log "========================================="

# Check if offline packages available
if [ -d "/opt/turnotec-installer/packages" ] && [ -n "\$(ls -A /opt/turnotec-installer/packages/*.deb 2>/dev/null)" ]; then
    log "✓ Offline packages detected - no network wait needed"
else
    log "⚠ No offline packages - waiting for network..."
    sleep 30
fi

# Run the main installation script
cd /opt/turnotec-installer

log "Running installation script..."
if bash ./install.sh --auto-confirm 2>&1 | tee -a "\$LOGFILE"; then
    log "✓ Installation completed successfully"

    # Remove installer files
    log "Cleaning up installer files..."
    rm -rf /opt/turnotec-installer

    # Disable this service
    log "Disabling first-boot service..."
    systemctl disable turnotec-firstboot.service

    log "========================================="
    log "TurnoTec Installation Complete!"
    log "========================================="
else
    log "ERROR: Installation failed!"
    log "Keeping installer files for debugging"
    log "Check /var/log/turnotec-first-boot.log for details"
fi

exit 0
FIRSTBOOT

chmod +x "$ROOTFS_MOUNT/opt/turnotec-installer/first_boot_install.sh"

echo -e "${GREEN}✓ First-boot installer created${NC}"
echo ""

# Install systemd service
echo "========================================="
echo "Step 6: Install First-Boot Service"
echo "========================================="
echo ""

# Copy systemd service
cp "$SCRIPT_DIR/setup/systemd/turnotec-firstboot.service" "$ROOTFS_MOUNT/etc/systemd/system/"

# Enable service (create symlink)
mkdir -p "$ROOTFS_MOUNT/etc/systemd/system/multi-user.target.wants"
ln -sf /etc/systemd/system/turnotec-firstboot.service \
    "$ROOTFS_MOUNT/etc/systemd/system/multi-user.target.wants/turnotec-firstboot.service"

echo -e "${GREEN}✓ First-boot service installed and enabled${NC}"
echo ""

# Create installation info
echo "========================================="
echo "Step 7: Create Installation Info"
echo "========================================="
echo ""

cat > "$ROOTFS_MOUNT/opt/turnotec-installer/install_info.txt" <<INSTALLINFO
TurnoTec SD Card Preparation
============================

Prepared on: $(date)
Prepared by: $(whoami)@$(hostname)
Script version: 4.0.0
FullPageOS boot path: $FULLPAGEOS_BOOT_PATH
Installation mode: $([ "$OFFLINE_MODE" = true ] && echo "OFFLINE" || echo "ONLINE")

This SD card has been prepared with TurnoTec system.

On first boot, the Raspberry Pi will:
1. Run the TurnoTec installation script automatically
2. Install all required packages $([ "$OFFLINE_MODE" = true ] && echo "from offline .deb files" || echo "via apt-get (REQUIRES ETHERNET!)")
3. Configure systemd services
4. Activate the hotspot "TurnoTec"
5. Show configuration instructions on the display

$([ "$OFFLINE_MODE" = true ] && echo "✓ NO ETHERNET NEEDED - Installation is fully offline!" || echo "⚠ IMPORTANT: CONNECT ETHERNET CABLE BEFORE FIRST BOOT!")

Expected first boot time: $([ "$OFFLINE_MODE" = true ] && echo "3-5 minutes" || echo "8-12 minutes")
After first boot, the display will show instructions for configuration.

Installation log: /var/log/turnotec-first-boot.log

FullPageOS Configuration:
- Boot path: $FULLPAGEOS_BOOT_PATH
- Config file: $FULLPAGEOS_BOOT_PATH/fullpageos.txt
- URL script: /opt/custompios/scripts/get_url
INSTALLINFO

# Store boot path for install script
echo "$FULLPAGEOS_BOOT_PATH" > "$ROOTFS_MOUNT/opt/turnotec-installer/boot_path.txt"

echo -e "${GREEN}✓ Installation info created${NC}"
echo ""

# Sync and unmount
echo "========================================="
echo "Step 8: Finalize and Unmount"
echo "========================================="
echo ""

echo "Syncing filesystems (this may take a minute)..."
sync
sync
sync
sleep 3
echo -e "${GREEN}✓ Filesystems synced${NC}"

echo "Unmounting partitions..."
if [ "$OS_TYPE" = "Darwin" ]; then
    diskutil unmountDisk "$SD_DEVICE"
else
    # Unmount with sync to ensure all data is written
    umount -f "$BOOT_MOUNT" 2>/dev/null || umount "$BOOT_MOUNT"
    umount -f "$ROOTFS_MOUNT" 2>/dev/null || umount "$ROOTFS_MOUNT"
    sync
    sleep 2
    rmdir "$BOOT_MOUNT" "$ROOTFS_MOUNT" 2>/dev/null || true
fi

echo -e "${GREEN}✓ Partitions unmounted safely${NC}"

echo ""
echo "========================================="
echo -e "${GREEN}✓ SD Card Preparation COMPLETE!${NC}"
echo "========================================="
echo ""
echo "Summary:"
echo "--------"
echo "  Boot path detected: $FULLPAGEOS_BOOT_PATH"
if [ "$OFFLINE_MODE" = true ]; then
    echo "  Installation method: Offline (ARM .deb packages)"
    echo "  Packages copied: $PKG_COPIED .deb files"
    echo "  Internet required: NO ✓"
else
    echo "  Installation method: Online (apt-get)"
    echo "  Internet required: YES (Ethernet needed)"
fi
echo "  First-boot service: Enabled"
echo ""

if [ "$OFFLINE_MODE" = true ]; then
    echo -e "${GREEN}✓ OFFLINE INSTALLATION - No Ethernet needed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Remove the SD card from your PC"
    echo "2. Insert it into the Raspberry Pi Zero 2 W"
    echo "3. Connect HDMI display"
    echo "4. Connect power"
    echo "5. Wait 3-5 minutes for offline installation"
    echo "6. The display will show configuration instructions"
    echo "7. Connect smartphone to hotspot 'TurnoTec' (password: Bacheca2025)"
    echo "8. Visit http://192.168.4.1 to configure"
else
    echo -e "${RED}⚠️  ETHERNET REQUIRED for online installation!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Remove the SD card from your PC"
    echo "2. Insert it into the Raspberry Pi Zero 2 W"
    echo "3. ${RED}CONNECT ETHERNET CABLE${NC}"
    echo "4. Connect HDMI display and power"
    echo "5. Wait 8-12 minutes for online installation"
    echo "6. The display will show configuration instructions"
    echo "7. Connect smartphone to hotspot 'TurnoTec' (password: Bacheca2025)"
    echo "8. Visit http://192.168.4.1 to configure"
fi

echo ""
echo -e "${GREEN}The SD card is ready to use!${NC}"
echo ""
