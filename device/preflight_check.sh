#!/bin/bash
###############################################################################
# TurnoTec - Pre-flight Check Script
# Run this before prepare_sd.sh to verify all files are ready
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ERRORS=0
WARNINGS=0

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         TurnoTec Pre-flight Check v5.0                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Checking if all required files are present..."
echo ""

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2 (missing: $1)"
        ((ERRORS++))
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2 (missing: $1)"
        ((ERRORS++))
    fi
}

check_file_warn() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${YELLOW}⚠${NC} $2 (missing: $1)"
        ((WARNINGS++))
    fi
}

echo "1. Core Scripts"
echo "────────────────────────────────────────────────────────────────"
check_file "$SCRIPT_DIR/install.sh" "Main installation script"
check_file "$SCRIPT_DIR/prepare_sd.sh" "SD card preparation script"
check_file "$SCRIPT_DIR/verify_installation.sh" "Installation verification script"
echo ""

echo "2. Setup Scripts"
echo "────────────────────────────────────────────────────────────────"
check_dir "$SCRIPT_DIR/setup" "Setup directory"
check_dir "$SCRIPT_DIR/setup/scripts" "Setup scripts directory"
check_file "$SCRIPT_DIR/setup/scripts/hotspot_manager.sh" "Hotspot manager"
check_file "$SCRIPT_DIR/setup/scripts/configure_device.sh" "Device configuration"
check_file "$SCRIPT_DIR/setup/scripts/connectivity_monitor.sh" "Connectivity monitor"
echo ""

echo "3. Systemd Services"
echo "────────────────────────────────────────────────────────────────"
check_dir "$SCRIPT_DIR/setup/systemd" "Systemd directory"
check_file "$SCRIPT_DIR/setup/systemd/turnotec-hotspot.service" "Hotspot service"
check_file "$SCRIPT_DIR/setup/systemd/turnotec-web.service" "Web service"
check_file "$SCRIPT_DIR/setup/systemd/turnotec-monitor.service" "Monitor service"
check_file "$SCRIPT_DIR/setup/systemd/turnotec-firstboot.service" "First boot service"
echo ""

echo "4. Web Application"
echo "────────────────────────────────────────────────────────────────"
check_dir "$SCRIPT_DIR/setup/web" "Web directory"
check_file "$SCRIPT_DIR/setup/web/app.py" "Flask application"
check_dir "$SCRIPT_DIR/setup/web/templates" "Templates directory"
check_file "$SCRIPT_DIR/setup/web/templates/setup.html" "Setup page template"
check_file "$SCRIPT_DIR/setup/web/templates/loading.html" "Loading page template"
echo ""

echo "5. Device Agent (v5.0 - Remote Control)"
echo "────────────────────────────────────────────────────────────────"
check_dir "$SCRIPT_DIR/agent" "Agent directory"
check_file "$SCRIPT_DIR/agent/turnotec_agent.py" "Device Agent script"
check_file "$SCRIPT_DIR/agent/requirements.txt" "Python dependencies"
check_file "$SCRIPT_DIR/agent/turnotec-agent.service" "Agent systemd service"
check_file "$SCRIPT_DIR/agent/update_agent.sh" "Agent update script"
echo ""

echo "6. ARM Packages (Optional - for Offline Installation)"
echo "────────────────────────────────────────────────────────────────"

if [ -d "$SCRIPT_DIR/packages" ]; then
    DEB_COUNT=$(ls -1 "$SCRIPT_DIR/packages"/*.deb 2>/dev/null | wc -l)
    if [ "$DEB_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓${NC} ARM packages directory exists ($DEB_COUNT .deb files)"
        echo -e "${GREEN}  → OFFLINE installation will be available${NC}"

        # Verify key packages
        REQUIRED_PKGS=("hostapd" "dnsmasq" "python3-flask")
        for pkg in "${REQUIRED_PKGS[@]}"; do
            if ls "$SCRIPT_DIR/packages"/*${pkg}*.deb &> /dev/null; then
                echo -e "${GREEN}  ✓${NC} Package: $pkg"
            else
                echo -e "${YELLOW}  ⚠${NC} Package missing: $pkg"
                ((WARNINGS++))
            fi
        done
    else
        echo -e "${YELLOW}⚠${NC} ARM packages directory empty"
        echo -e "${YELLOW}  → Only ONLINE installation will be available${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} ARM packages directory not found"
    echo -e "${YELLOW}  → Only ONLINE installation will be available${NC}"
    echo -e "  To enable offline installation, run:"
    echo -e "    ./download_packages_arm.sh"
    ((WARNINGS++))
fi

echo ""

echo "7. Configuration Files"
echo "────────────────────────────────────────────────────────────────"
check_dir "$SCRIPT_DIR/config" "Config directory"
echo ""

echo "8. Required System Tools"
echo "────────────────────────────────────────────────────────────────"

check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $2: $(which $1)"
    else
        echo -e "${RED}✗${NC} $2 not found"
        ((ERRORS++))
    fi
}

check_command "mount" "mount command"
check_command "umount" "umount command"

# Check OS-specific tools
OS_TYPE="$(uname -s)"
if [ "$OS_TYPE" = "Darwin" ]; then
    check_command "diskutil" "diskutil (macOS)"
else
    check_command "lsblk" "lsblk (Linux)"
fi

# Optional but recommended
if command -v jq &> /dev/null; then
    echo -e "${GREEN}✓${NC} jq: $(which jq)"
else
    echo -e "${YELLOW}⚠${NC} jq not found (recommended but not required)"
    echo -e "  Install with: sudo apt-get install jq (Linux) or brew install jq (Mac)"
    ((WARNINGS++))
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "                      Summary"
echo "════════════════════════════════════════════════════════════════"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "You are ready to prepare the SD card."
    echo "Run: sudo ./prepare_sd.sh"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ All critical files present, but with $WARNINGS warning(s)${NC}"
    echo ""
    echo "You can proceed, but review warnings above."
    if [ ! -d "$SCRIPT_DIR/packages" ]; then
        echo ""
        echo "Recommendation:"
        echo "  For offline installation, run: ./download_packages_arm.sh"
    fi
    echo ""
    echo "To prepare SD card: sudo ./prepare_sd.sh"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Found $ERRORS critical error(s) and $WARNINGS warning(s)${NC}"
    echo ""
    echo "Please fix the errors above before proceeding."
    echo ""
    echo "Common fixes:"
    echo "  - Ensure you're in the /device directory"
    echo "  - Run git pull to update all files"
    echo "  - Check file permissions"
    echo ""
    exit 1
fi
