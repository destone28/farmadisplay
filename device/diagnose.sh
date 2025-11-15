#!/bin/bash
###############################################################################
# TurnoTec - Diagnostic Script
# Analyzes WiFi connection issues
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=================================="
echo "TurnoTec WiFi Diagnostic Tool"
echo "=================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}WARNING: Not running as root. Some checks may fail.${NC}"
    echo "For full diagnostics, run: sudo $0"
    echo ""
fi

echo -e "${BLUE}[1] Checking TurnoTec Installation${NC}"
echo "-----------------------------------"
if [ -d "/opt/turnotec" ]; then
    echo -e "${GREEN}✓ TurnoTec directory exists${NC}"

    if [ -f "/opt/turnotec/config.json" ]; then
        echo -e "${GREEN}✓ Configuration file exists${NC}"
        echo "Configuration:"
        cat /opt/turnotec/config.json | jq '.' 2>/dev/null || cat /opt/turnotec/config.json
    else
        echo -e "${RED}✗ Configuration file missing${NC}"
    fi

    if [ -f "/opt/turnotec/state.json" ]; then
        echo -e "${GREEN}✓ State file exists${NC}"
    else
        echo -e "${YELLOW}⚠ State file missing${NC}"
    fi
else
    echo -e "${RED}✗ TurnoTec not installed${NC}"
fi
echo ""

echo -e "${BLUE}[2] Checking Scripts${NC}"
echo "-----------------------------------"
SCRIPTS_DIR="/opt/turnotec/scripts"

if [ -f "$SCRIPTS_DIR/generate_psk.py" ]; then
    echo -e "${GREEN}✓ generate_psk.py exists${NC}"

    # Test the script
    TEST_OUTPUT=$("$SCRIPTS_DIR/generate_psk.py" "TestNet" "TestPass123" 2>&1)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ generate_psk.py is working${NC}"
        echo "  Sample hash: ${TEST_OUTPUT:0:32}..."
    else
        echo -e "${RED}✗ generate_psk.py test failed${NC}"
        echo "  Error: $TEST_OUTPUT"
    fi
else
    echo -e "${RED}✗ generate_psk.py MISSING (WiFi fix not installed!)${NC}"
fi

if [ -f "$SCRIPTS_DIR/configure_device.sh" ]; then
    echo -e "${GREEN}✓ configure_device.sh exists${NC}"

    if grep -q "generate_psk.py" "$SCRIPTS_DIR/configure_device.sh"; then
        echo -e "${GREEN}✓ configure_device.sh uses PSK hash generation${NC}"
    else
        echo -e "${RED}✗ configure_device.sh does NOT use PSK hash (old version!)${NC}"
    fi
else
    echo -e "${RED}✗ configure_device.sh missing${NC}"
fi
echo ""

echo -e "${BLUE}[3] Checking WiFi Configuration${NC}"
echo "-----------------------------------"
if [ -f "/etc/wpa_supplicant/wpa_supplicant.conf" ]; then
    echo -e "${GREEN}✓ wpa_supplicant.conf exists${NC}"
    echo "Content:"
    cat /etc/wpa_supplicant/wpa_supplicant.conf
    echo ""

    # Check if password is hashed or plain
    if grep -q 'psk=[0-9a-f]\{64\}' /etc/wpa_supplicant/wpa_supplicant.conf; then
        echo -e "${GREEN}✓ Password is HASHED (secure)${NC}"
    elif grep -q 'psk="' /etc/wpa_supplicant/wpa_supplicant.conf; then
        echo -e "${YELLOW}⚠ Password is in PLAIN TEXT (may fail with special chars)${NC}"
    else
        echo -e "${YELLOW}⚠ Could not determine password format${NC}"
    fi
else
    echo -e "${RED}✗ wpa_supplicant.conf missing${NC}"
fi
echo ""

echo -e "${BLUE}[4] Checking Network Interfaces${NC}"
echo "-----------------------------------"
ip link show wlan0 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ wlan0 interface exists${NC}"

    # Check if connected
    iwconfig wlan0 2>/dev/null | grep -q "ESSID:off"
    if [ $? -eq 0 ]; then
        echo -e "${YELLOW}⚠ wlan0 is NOT connected to any network${NC}"
    else
        ESSID=$(iwconfig wlan0 2>/dev/null | grep ESSID | sed 's/.*ESSID:"\(.*\)".*/\1/')
        if [ -n "$ESSID" ]; then
            echo -e "${GREEN}✓ Connected to: $ESSID${NC}"
        fi
    fi
else
    echo -e "${RED}✗ wlan0 interface not found${NC}"
fi
echo ""

echo -e "${BLUE}[5] Checking WiFi Status${NC}"
echo "-----------------------------------"
wpa_cli -i wlan0 status 2>/dev/null
echo ""

echo -e "${BLUE}[6] Recent WiFi Logs${NC}"
echo "-----------------------------------"
if [ -f "/var/log/turnotec-configure.log" ]; then
    echo "Last configuration attempt:"
    tail -20 /var/log/turnotec-configure.log
else
    echo -e "${YELLOW}⚠ No configuration logs found${NC}"
fi
echo ""

echo -e "${BLUE}[7] WPA Supplicant Logs${NC}"
echo "-----------------------------------"
journalctl -u wpa_supplicant -n 30 --no-pager 2>/dev/null || echo "journalctl not available"
echo ""

echo -e "${BLUE}[8] Hotspot Status${NC}"
echo "-----------------------------------"
if [ -f "/opt/turnotec/state.json" ]; then
    HOTSPOT_ACTIVE=$(jq -r '.hotspot_active // "unknown"' /opt/turnotec/state.json 2>/dev/null)
    if [ "$HOTSPOT_ACTIVE" = "true" ]; then
        echo -e "${YELLOW}⚠ Hotspot is ACTIVE (device not connected to WiFi)${NC}"
    elif [ "$HOTSPOT_ACTIVE" = "false" ]; then
        echo -e "${GREEN}✓ Hotspot is INACTIVE (should be connected to WiFi)${NC}"
    else
        echo -e "${YELLOW}⚠ Hotspot status unknown${NC}"
    fi
fi

systemctl is-active --quiet hostapd 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${YELLOW}⚠ hostapd service is running (hotspot active)${NC}"
else
    echo -e "${GREEN}✓ hostapd service is not running${NC}"
fi
echo ""

echo "=================================="
echo -e "${BLUE}Diagnosis Complete${NC}"
echo "=================================="
echo ""

# Summary and recommendations
echo -e "${YELLOW}RECOMMENDATIONS:${NC}"
if [ ! -f "$SCRIPTS_DIR/generate_psk.py" ]; then
    echo -e "${RED}1. UPDATE REQUIRED: WiFi PSK fix is not installed!${NC}"
    echo "   Run: sudo ./update_device.sh"
    echo ""
fi

if grep -q 'psk="' /etc/wpa_supplicant/wpa_supplicant.conf 2>/dev/null; then
    echo -e "${YELLOW}2. Password is in plain text - may cause issues with special characters${NC}"
    echo "   Reconfigure WiFi after updating scripts"
    echo ""
fi

if systemctl is-active --quiet hostapd 2>/dev/null; then
    echo -e "${YELLOW}3. Hotspot is still active - WiFi connection may have failed${NC}"
    echo "   Check WiFi credentials and signal strength"
    echo ""
fi
