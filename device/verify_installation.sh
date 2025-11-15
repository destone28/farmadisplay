#!/bin/bash
###############################################################################
# TurnoTec - Installation Verification Script
# Run this on the Raspberry Pi after installation to verify everything works
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNING=0

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        TurnoTec Installation Verification v5.0               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

test_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((TESTS_PASSED++))
}

test_fail() {
    echo -e "${RED}✗${NC} $1"
    ((TESTS_FAILED++))
}

test_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((TESTS_WARNING++))
}

test_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

echo "1. System Information"
echo "────────────────────────────────────────────────────────────────"

# Check if Raspberry Pi
if grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    test_pass "Running on Raspberry Pi"
else
    test_warn "Not a Raspberry Pi (test environment?)"
fi

# Check OS
if [ -f /etc/os-release ]; then
    OS_NAME=$(grep "^PRETTY_NAME=" /etc/os-release | cut -d'"' -f2)
    test_info "OS: $OS_NAME"
fi

echo ""

echo "2. Directory Structure"
echo "────────────────────────────────────────────────────────────────"

# Check main directories
if [ -d "/opt/turnotec" ]; then
    test_pass "Main directory exists: /opt/turnotec"
else
    test_fail "Main directory missing: /opt/turnotec"
fi

if [ -d "/opt/turnotec/scripts" ]; then
    test_pass "Scripts directory exists"
else
    test_fail "Scripts directory missing"
fi

if [ -d "/opt/turnotec/web" ]; then
    test_pass "Web directory exists"
else
    test_fail "Web directory missing"
fi

if [ -d "/opt/turnotec/agent" ]; then
    test_pass "Agent directory exists (v5.0)"
else
    test_fail "Agent directory missing (v5.0 feature)"
fi

if [ -d "/var/log/turnotec" ]; then
    test_pass "Log directory exists"
else
    test_fail "Log directory missing"
fi

echo ""

echo "3. Configuration Files"
echo "────────────────────────────────────────────────────────────────"

# Check state.json
if [ -f "/opt/turnotec/state.json" ]; then
    test_pass "State file exists"
    VERSION=$(jq -r '.version // "unknown"' /opt/turnotec/state.json 2>/dev/null)
    if [ "$VERSION" == "5.0.0" ]; then
        test_pass "Version: $VERSION (latest)"
    else
        test_warn "Version: $VERSION (expected 5.0.0)"
    fi
else
    test_fail "State file missing"
fi

# Check config.json
if [ -f "/opt/turnotec/config.json" ]; then
    test_pass "Configuration file exists"

    CONFIGURED=$(jq -r '.configured // false' /opt/turnotec/config.json 2>/dev/null)
    if [ "$CONFIGURED" == "true" ]; then
        test_pass "Device is configured"

        DISPLAY_ID=$(jq -r '.display_id // "none"' /opt/turnotec/config.json 2>/dev/null)
        if [ "$DISPLAY_ID" != "none" ]; then
            test_pass "Display ID: $DISPLAY_ID"
        else
            test_fail "Display ID not set"
        fi

        SERIAL=$(jq -r '.serial_number // "none"' /opt/turnotec/config.json 2>/dev/null)
        if [ "$SERIAL" != "none" ]; then
            test_pass "Serial Number: $SERIAL"
        else
            test_warn "Serial number not set"
        fi
    else
        test_warn "Device not configured yet (run web setup)"
    fi
else
    test_warn "Configuration file not created yet"
fi

echo ""

echo "4. Required Scripts"
echo "────────────────────────────────────────────────────────────────"

# Check scripts
SCRIPTS=(
    "hotspot_manager.sh"
    "configure_device.sh"
    "connectivity_monitor.sh"
    "update_agent.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [ -x "/opt/turnotec/scripts/$script" ]; then
        test_pass "Script executable: $script"
    elif [ -f "/opt/turnotec/scripts/$script" ]; then
        test_warn "Script exists but not executable: $script"
        chmod +x "/opt/turnotec/scripts/$script" 2>/dev/null && test_info "  Fixed permissions"
    else
        test_fail "Script missing: $script"
    fi
done

echo ""

echo "5. Python Components"
echo "────────────────────────────────────────────────────────────────"

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
    test_pass "Python 3 installed: $PYTHON_VERSION"
else
    test_fail "Python 3 not found"
fi

# Check Flask app
if [ -f "/opt/turnotec/web/app.py" ]; then
    test_pass "Flask app exists"
else
    test_fail "Flask app missing"
fi

# Check Agent
if [ -f "/opt/turnotec/agent/turnotec_agent.py" ]; then
    test_pass "Device Agent exists (v5.0)"

    if [ -x "/opt/turnotec/agent/turnotec_agent.py" ]; then
        test_pass "Agent is executable"
    else
        test_warn "Agent not executable"
    fi
else
    test_fail "Device Agent missing (v5.0 feature)"
fi

# Check Python dependencies
if command -v pip3 &> /dev/null; then
    test_pass "pip3 installed"

    # Check required packages
    REQUIRED_PKGS=("flask" "psutil" "requests")
    for pkg in "${REQUIRED_PKGS[@]}"; do
        if pip3 list 2>/dev/null | grep -iq "^$pkg "; then
            test_pass "Python package: $pkg"
        else
            test_fail "Python package missing: $pkg"
        fi
    done
else
    test_warn "pip3 not found"
fi

echo ""

echo "6. Systemd Services"
echo "────────────────────────────────────────────────────────────────"

# Check services
SERVICES=(
    "turnotec-hotspot"
    "turnotec-web"
    "turnotec-monitor"
    "turnotec-agent"
)

for service in "${SERVICES[@]}"; do
    if systemctl list-unit-files | grep -q "$service.service"; then
        if systemctl is-enabled "$service.service" &> /dev/null; then
            if systemctl is-active "$service.service" &> /dev/null; then
                test_pass "Service running: $service"
            else
                test_warn "Service enabled but not running: $service"
                test_info "  Try: sudo systemctl start $service"
            fi
        else
            test_warn "Service installed but not enabled: $service"
            test_info "  Try: sudo systemctl enable $service"
        fi
    else
        test_fail "Service not installed: $service"
    fi
done

echo ""

echo "7. Network Configuration"
echo "────────────────────────────────────────────────────────────────"

# Check WiFi interface
if ip link show wlan0 &> /dev/null; then
    test_pass "WiFi interface (wlan0) exists"

    # Check if rfkill blocked
    if command -v rfkill &> /dev/null; then
        if rfkill list wifi | grep -q "Soft blocked: no"; then
            test_pass "WiFi not blocked by rfkill"
        else
            test_warn "WiFi blocked by rfkill"
            test_info "  Try: sudo rfkill unblock wifi"
        fi
    fi
else
    test_warn "WiFi interface not found (wlan0)"
fi

# Check Ethernet interface
if ip link show eth0 &> /dev/null; then
    test_pass "Ethernet interface (eth0) exists"

    # Check if connected
    if ip addr show eth0 | grep -q "inet "; then
        ETH_IP=$(ip addr show eth0 | grep "inet " | awk '{print $2}' | cut -d'/' -f1)
        test_pass "Ethernet connected: $ETH_IP"
    else
        test_info "Ethernet not connected (OK if using WiFi)"
    fi
else
    test_warn "Ethernet interface not found"
fi

# Check internet connectivity
if ping -c 1 -W 3 8.8.8.8 &> /dev/null; then
    test_pass "Internet connectivity (ping 8.8.8.8)"
else
    test_warn "No internet connectivity"
fi

# Check DNS
if ping -c 1 -W 3 turnotec.com &> /dev/null; then
    test_pass "DNS resolution (turnotec.com)"
else
    test_warn "DNS not working (turnotec.com unreachable)"
fi

echo ""

echo "8. FullPageOS Configuration"
echo "────────────────────────────────────────────────────────────────"

# Detect boot path
BOOT_PATH="/boot"
if [ -d "/boot/firmware" ]; then
    BOOT_PATH="/boot/firmware"
    test_info "Boot path: $BOOT_PATH (Bookworm+)"
else
    test_info "Boot path: $BOOT_PATH (Legacy)"
fi

# Check fullpageos.txt
if [ -f "$BOOT_PATH/fullpageos.txt" ]; then
    test_pass "FullPageOS config exists"

    URL=$(cat "$BOOT_PATH/fullpageos.txt")
    test_info "Display URL: $URL"

    if [[ "$URL" == *"turnotec.com"* ]]; then
        test_pass "URL points to production"
    elif [[ "$URL" == *"192.168.4.1"* ]] || [[ "$URL" == *"loading.html"* ]]; then
        test_warn "URL points to local setup page (not configured yet)"
    else
        test_info "Custom URL configured"
    fi
else
    test_fail "FullPageOS config missing"
fi

echo ""

echo "9. Log Files"
echo "────────────────────────────────────────────────────────────────"

# Check log files
LOGS=(
    "agent.log"
    "configure.log"
)

for log in "${LOGS[@]}"; do
    if [ -f "/var/log/turnotec/$log" ]; then
        SIZE=$(du -h "/var/log/turnotec/$log" 2>/dev/null | cut -f1)
        test_pass "Log exists: $log ($SIZE)"
    else
        test_info "Log not created yet: $log"
    fi
done

# Check agent log for recent activity
if [ -f "/var/log/turnotec/agent.log" ]; then
    LAST_HEARTBEAT=$(grep "Heartbeat sent successfully" /var/log/turnotec/agent.log 2>/dev/null | tail -1)
    if [ -n "$LAST_HEARTBEAT" ]; then
        test_pass "Agent heartbeat detected in logs"
        test_info "  Last: $(echo $LAST_HEARTBEAT | cut -d' ' -f1-2)"
    else
        test_warn "No heartbeat in agent logs (device may not be configured)"
    fi
fi

echo ""

echo "10. Disk Usage"
echo "────────────────────────────────────────────────────────────────"

# Check disk space
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
DISK_AVAIL=$(df -h / | tail -1 | awk '{print $4}')

if [ "$DISK_USAGE" -lt 80 ]; then
    test_pass "Disk usage: ${DISK_USAGE}% (${DISK_AVAIL} available)"
elif [ "$DISK_USAGE" -lt 90 ]; then
    test_warn "Disk usage: ${DISK_USAGE}% (${DISK_AVAIL} available)"
else
    test_fail "Disk usage critical: ${DISK_USAGE}% (${DISK_AVAIL} available)"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "                      Test Summary"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}Passed:  $TESTS_PASSED${NC}"
echo -e "${YELLOW}Warnings: $TESTS_WARNING${NC}"
echo -e "${RED}Failed:  $TESTS_FAILED${NC}"
echo ""

# Overall status
if [ $TESTS_FAILED -eq 0 ]; then
    if [ $TESTS_WARNING -eq 0 ]; then
        echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}✓ All tests passed! System is fully operational.${NC}"
        echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
        exit 0
    else
        echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
        echo -e "${YELLOW}⚠ System operational but has warnings.${NC}"
        echo -e "${YELLOW}  Review warnings above and fix if necessary.${NC}"
        echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
        exit 0
    fi
else
    echo -e "${RED}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}✗ System has failures!${NC}"
    echo -e "${RED}  Review failed tests above and fix issues.${NC}"
    echo -e "${RED}════════════════════════════════════════════════════════════════${NC}"
    exit 1
fi
