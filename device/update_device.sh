#!/bin/bash
###############################################################################
# TurnoTec - Device Update Script
# Updates WiFi PSK fix on Raspberry Pi
###############################################################################

set -e

echo "=================================="
echo "TurnoTec Device Update Script"
echo "WiFi PSK Fix Installation"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}ERROR: This script must be run as root${NC}"
    echo "Usage: sudo $0"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="/opt/turnotec/scripts"

echo -e "${YELLOW}[1/5] Checking current installation...${NC}"
if [ ! -d "/opt/turnotec" ]; then
    echo -e "${RED}ERROR: TurnoTec not installed in /opt/turnotec${NC}"
    exit 1
fi
echo -e "${GREEN}✓ TurnoTec installation found${NC}"
echo ""

echo -e "${YELLOW}[2/5] Backing up current scripts...${NC}"
BACKUP_DIR="/opt/turnotec/scripts.backup.$(date +%s)"
mkdir -p "$BACKUP_DIR"
cp -r /opt/turnotec/scripts/* "$BACKUP_DIR/" 2>/dev/null || true
echo -e "${GREEN}✓ Backup created at $BACKUP_DIR${NC}"
echo ""

echo -e "${YELLOW}[3/5] Installing new generate_psk.py...${NC}"
if [ -f "$SCRIPT_DIR/setup/scripts/generate_psk.py" ]; then
    cp "$SCRIPT_DIR/setup/scripts/generate_psk.py" "$TARGET_DIR/"
    chmod +x "$TARGET_DIR/generate_psk.py"
    echo -e "${GREEN}✓ generate_psk.py installed${NC}"
else
    echo -e "${RED}ERROR: generate_psk.py not found in $SCRIPT_DIR/setup/scripts/${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}[4/5] Updating configure_device.sh...${NC}"
if [ -f "$SCRIPT_DIR/setup/scripts/configure_device.sh" ]; then
    cp "$SCRIPT_DIR/setup/scripts/configure_device.sh" "$TARGET_DIR/"
    chmod +x "$TARGET_DIR/configure_device.sh"
    echo -e "${GREEN}✓ configure_device.sh updated${NC}"
else
    echo -e "${RED}ERROR: configure_device.sh not found in $SCRIPT_DIR/setup/scripts/${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}[5/5] Verifying installation...${NC}"

# Test Python script
if [ -f "$TARGET_DIR/generate_psk.py" ]; then
    # Test with a sample
    TEST_OUTPUT=$("$TARGET_DIR/generate_psk.py" "TestNetwork" "TestPassword123" 2>&1)
    if [ $? -eq 0 ] && echo "$TEST_OUTPUT" | grep -qE '^[0-9a-f]{64}$'; then
        echo -e "${GREEN}✓ generate_psk.py is working correctly${NC}"
    else
        echo -e "${RED}ERROR: generate_psk.py test failed${NC}"
        echo "Output: $TEST_OUTPUT"
        exit 1
    fi
else
    echo -e "${RED}ERROR: generate_psk.py not found after installation${NC}"
    exit 1
fi

# Check configure_device.sh
if grep -q "generate_psk.py" "$TARGET_DIR/configure_device.sh"; then
    echo -e "${GREEN}✓ configure_device.sh uses PSK hash generation${NC}"
else
    echo -e "${RED}WARNING: configure_device.sh may not be using PSK hash${NC}"
fi

echo ""
echo "=================================="
echo -e "${GREEN}Update completed successfully!${NC}"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Reconnect to the TurnoTec hotspot"
echo "2. Access http://192.168.4.1:8080/"
echo "3. Configure WiFi with your credentials"
echo "4. The system will now properly handle special characters in passwords"
echo ""
echo "Backup location: $BACKUP_DIR"
echo ""

exit 0
