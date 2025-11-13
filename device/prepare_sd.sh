#!/bin/bash
###############################################################################
# TurnoTec - SD Card Preparation Script (Linux/Mac)
# Prepares a FullPageOS SD card with TurnoTec system from PC
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
echo -e "${GREEN}Script directory: $SCRIPT_DIR${NC}"
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
    BOOT_MOUNT="/Volumes/boot"
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

    # Check if mounted
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

# Copy Chromium flags to boot partition
echo "Copying Chromium flags to boot partition..."
cp "$SCRIPT_DIR/config/chromium-flags.txt" "$BOOT_MOUNT/" 2>/dev/null || {
    echo -e "${YELLOW}⚠ Could not copy chromium-flags.txt to boot (will be done at first boot)${NC}"
}

# Copy FullPageOS config template to boot partition
echo "Copying FullPageOS configuration..."
cp "$SCRIPT_DIR/config/fullpageos-template.txt" "$BOOT_MOUNT/fullpageos.txt" 2>/dev/null || {
    echo -e "${YELLOW}⚠ Could not copy fullpageos.txt to boot (will be done at first boot)${NC}"
}

echo -e "${GREEN}✓ Boot partition configured${NC}"
echo ""

# Create first-boot installation script
echo "========================================="
echo "Step 4: Create First-Boot Installer"
echo "========================================="
echo ""

cat > "$ROOTFS_MOUNT/opt/turnotec-installer/first_boot_install.sh" <<'FIRSTBOOT'
#!/bin/bash
###############################################################################
# TurnoTec - First Boot Installation Script
# Executed automatically on first boot to install TurnoTec system
###############################################################################

LOGFILE="/var/log/turnotec-first-boot.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOGFILE"
}

log "========================================="
log "TurnoTec First Boot Installation Started"
log "========================================="

# Wait for network to be ready (not critical, but helpful)
sleep 10

# Run the main installation script
cd /opt/turnotec-installer

log "Running installation script..."
bash ./install.sh --auto-confirm 2>&1 | tee -a "$LOGFILE"

if [ $? -eq 0 ]; then
    log "✓ Installation completed successfully"

    # Remove installer files to save space
    log "Cleaning up installer files..."
    rm -rf /opt/turnotec-installer

    # Remove this script from rc.local
    log "Removing first-boot script from startup..."
    sed -i '/turnotec-installer\/first_boot_install.sh/d' /etc/rc.local

    log "========================================="
    log "TurnoTec Installation Complete!"
    log "System will continue normal boot..."
    log "========================================="
else
    log "ERROR: Installation failed!"
    log "Installer files kept in /opt/turnotec-installer for debugging"
fi

exit 0
FIRSTBOOT

chmod +x "$ROOTFS_MOUNT/opt/turnotec-installer/first_boot_install.sh"

echo -e "${GREEN}✓ First-boot installer created${NC}"
echo ""

# Modify install.sh to support auto-confirm
echo "Modifying install.sh for automated installation..."
sed -i.bak 's/read -p "Reboot now? (Y\/n)"/# Auto-confirm mode\nif [ "$1" != "--auto-confirm" ]; then\n    read -p "Reboot now? (Y\/n)"/' "$ROOTFS_MOUNT/opt/turnotec-installer/install.sh" 2>/dev/null || true

# Configure rc.local for first boot
echo "========================================="
echo "Step 5: Configure First Boot Execution"
echo "========================================="
echo ""

# Check if rc.local exists
if [ ! -f "$ROOTFS_MOUNT/etc/rc.local" ]; then
    echo "Creating /etc/rc.local..."
    cat > "$ROOTFS_MOUNT/etc/rc.local" <<'RCLOCAL'
#!/bin/bash
# rc.local - executed at the end of each multiuser runlevel

exit 0
RCLOCAL
    chmod +x "$ROOTFS_MOUNT/etc/rc.local"
fi

# Add first-boot script to rc.local (before exit 0)
if ! grep -q "turnotec-installer/first_boot_install.sh" "$ROOTFS_MOUNT/etc/rc.local"; then
    echo "Adding TurnoTec first-boot installation to rc.local..."

    # Remove existing exit 0
    sed -i '/^exit 0/d' "$ROOTFS_MOUNT/etc/rc.local"

    # Add our script and exit 0
    cat >> "$ROOTFS_MOUNT/etc/rc.local" <<'RCADD'

# TurnoTec First Boot Installation (auto-removes after execution)
if [ -f /opt/turnotec-installer/first_boot_install.sh ]; then
    /opt/turnotec-installer/first_boot_install.sh &
fi

exit 0
RCADD

    chmod +x "$ROOTFS_MOUNT/etc/rc.local"
fi

echo -e "${GREEN}✓ First-boot execution configured in rc.local${NC}"
echo ""

# Enable SSH (if not already)
echo "========================================="
echo "Step 6: Enable SSH"
echo "========================================="
echo ""

touch "$BOOT_MOUNT/ssh"
echo -e "${GREEN}✓ SSH enabled${NC}"
echo ""

# Create installation marker file
echo "========================================="
echo "Step 7: Create Installation Info"
echo "========================================="
echo ""

cat > "$ROOTFS_MOUNT/opt/turnotec-installer/install_info.txt" <<INSTALLINFO
TurnoTec SD Card Preparation
============================

Prepared on: $(date)
Prepared by: $(whoami)@$(hostname)
Script version: 1.0.0

This SD card has been prepared with TurnoTec system.

On first boot, the Raspberry Pi will:
1. Run the TurnoTec installation script automatically
2. Install all required packages (hostapd, dnsmasq, Flask, etc.)
3. Configure systemd services
4. Activate the hotspot "TurnoTec"
5. Show configuration instructions on the display

Expected first boot time: 5-10 minutes
After first boot, the display will show instructions for configuration.

Installation log will be available at: /var/log/turnotec-first-boot.log
INSTALLINFO

echo -e "${GREEN}✓ Installation info created${NC}"
echo ""

# Sync and unmount
echo "========================================="
echo "Step 8: Finalize and Unmount"
echo "========================================="
echo ""

echo "Syncing filesystems..."
sync
sleep 2

echo "Unmounting partitions..."
if [ "$OS_TYPE" = "Darwin" ]; then
    diskutil unmountDisk "$SD_DEVICE"
else
    umount "$BOOT_MOUNT"
    umount "$ROOTFS_MOUNT"
    rmdir "$BOOT_MOUNT" "$ROOTFS_MOUNT" 2>/dev/null || true
fi

echo ""
echo "========================================="
echo -e "${GREEN}✓ SD Card Preparation COMPLETE!${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Remove the SD card from your PC"
echo "2. Insert it into the Raspberry Pi Zero 2 W"
echo "3. Connect HDMI display and power"
echo "4. Wait 5-10 minutes for first boot installation"
echo "5. The display will show configuration instructions"
echo "6. Connect smartphone to hotspot 'TurnoTec' (password: Bacheca2025)"
echo "7. Visit http://192.168.4.1 to configure"
echo ""
echo -e "${GREEN}The SD card is ready to use!${NC}"
echo ""
