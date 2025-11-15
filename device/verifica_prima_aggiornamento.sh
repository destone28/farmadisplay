#!/bin/bash
###############################################################################
# TurnoTec - Pre-Update Verification Script
# Verifies you have everything needed before updating SD card
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=================================================="
echo "TurnoTec - Verifica Pre-Aggiornamento"
echo "=================================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ERRORS=0
WARNINGS=0

echo -e "${BLUE}[1] Verifica Git Branch${NC}"
cd "$SCRIPT_DIR/.."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

if [ "$CURRENT_BRANCH" = "claude/debug-wifi-connection-018mVJrauq5H2iobsu3KK8Y4" ]; then
    echo -e "${GREEN}✓ Branch corretto: $CURRENT_BRANCH${NC}"
else
    echo -e "${RED}✗ Branch errato: $CURRENT_BRANCH${NC}"
    echo -e "${YELLOW}  Devi fare: git checkout claude/debug-wifi-connection-018mVJrauq5H2iobsu3KK8Y4${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo -e "${BLUE}[2] Verifica File Necessari${NC}"

# Check generate_psk.py
if [ -f "$SCRIPT_DIR/setup/scripts/generate_psk.py" ]; then
    echo -e "${GREEN}✓ generate_psk.py presente${NC}"

    # Check if it's executable
    if [ -x "$SCRIPT_DIR/setup/scripts/generate_psk.py" ]; then
        echo -e "${GREEN}  ✓ generate_psk.py è eseguibile${NC}"
    else
        echo -e "${YELLOW}  ⚠ generate_psk.py non è eseguibile${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi

    # Check shebang
    if head -n 1 "$SCRIPT_DIR/setup/scripts/generate_psk.py" | grep -q "python3"; then
        echo -e "${GREEN}  ✓ Shebang Python corretto${NC}"
    else
        echo -e "${RED}  ✗ Shebang Python mancante o errato${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗ generate_psk.py NON TROVATO${NC}"
    echo "  Percorso: $SCRIPT_DIR/setup/scripts/generate_psk.py"
    ERRORS=$((ERRORS + 1))
fi

# Check configure_device.sh
if [ -f "$SCRIPT_DIR/setup/scripts/configure_device.sh" ]; then
    echo -e "${GREEN}✓ configure_device.sh presente${NC}"

    # Check if it has the fix
    if grep -q "Generating secure PSK hash" "$SCRIPT_DIR/setup/scripts/configure_device.sh"; then
        echo -e "${GREEN}  ✓ configure_device.sh contiene il fix WiFi${NC}"
    else
        echo -e "${RED}  ✗ configure_device.sh NON contiene il fix WiFi${NC}"
        echo "  Lo script è quello vecchio!"
        ERRORS=$((ERRORS + 1))
    fi

    # Check if it references generate_psk.py
    if grep -q "generate_psk.py" "$SCRIPT_DIR/setup/scripts/configure_device.sh"; then
        echo -e "${GREEN}  ✓ configure_device.sh usa generate_psk.py${NC}"
    else
        echo -e "${RED}  ✗ configure_device.sh NON usa generate_psk.py${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗ configure_device.sh NON TROVATO${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check update_sd_card.sh
if [ -f "$SCRIPT_DIR/update_sd_card.sh" ]; then
    echo -e "${GREEN}✓ update_sd_card.sh presente${NC}"

    if [ -x "$SCRIPT_DIR/update_sd_card.sh" ]; then
        echo -e "${GREEN}  ✓ update_sd_card.sh è eseguibile${NC}"
    else
        echo -e "${YELLOW}  ⚠ update_sd_card.sh non è eseguibile${NC}"
        echo "  Esegui: chmod +x $SCRIPT_DIR/update_sd_card.sh"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}✗ update_sd_card.sh NON TROVATO${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

echo -e "${BLUE}[3] Test generate_psk.py${NC}"

if [ -f "$SCRIPT_DIR/setup/scripts/generate_psk.py" ]; then
    # Test the script
    TEST_OUTPUT=$("$SCRIPT_DIR/setup/scripts/generate_psk.py" "TestNetwork" "TestPass123" 2>&1)
    TEST_EXIT=$?

    if [ $TEST_EXIT -eq 0 ]; then
        echo -e "${GREEN}✓ generate_psk.py funziona correttamente${NC}"
        echo "  Sample hash: ${TEST_OUTPUT:0:32}..."

        # Verify it's a valid hash
        if echo "$TEST_OUTPUT" | grep -qE '^[0-9a-f]{64}$'; then
            echo -e "${GREEN}  ✓ Hash valido (64 caratteri hex)${NC}"
        else
            echo -e "${RED}  ✗ Hash NON valido${NC}"
            echo "  Output: $TEST_OUTPUT"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo -e "${RED}✗ generate_psk.py FALLITO${NC}"
        echo "  Error: $TEST_OUTPUT"
        ERRORS=$((ERRORS + 1))
    fi

    # Test with special characters
    TEST_OUTPUT2=$("$SCRIPT_DIR/setup/scripts/generate_psk.py" "Uaifai" "#QuestaQui23!" 2>&1)
    TEST_EXIT2=$?

    if [ $TEST_EXIT2 -eq 0 ]; then
        echo -e "${GREEN}✓ generate_psk.py funziona con caratteri speciali${NC}"
        echo "  Hash per '#QuestaQui23!': ${TEST_OUTPUT2:0:32}..."
    else
        echo -e "${RED}✗ generate_psk.py FALLISCE con caratteri speciali${NC}"
        echo "  Error: $TEST_OUTPUT2"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠ Impossibile testare generate_psk.py (file non trovato)${NC}"
fi

echo ""

echo -e "${BLUE}[4] Verifica Python${NC}"

if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ Python3 installato: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}✗ Python3 NON installato${NC}"
    echo "  Installa con: sudo apt install python3"
    ERRORS=$((ERRORS + 1))
fi

echo ""

echo -e "${BLUE}[5] Verifica Dipendenze${NC}"

# Check jq
if command -v jq &> /dev/null; then
    echo -e "${GREEN}✓ jq installato${NC}"
else
    echo -e "${YELLOW}⚠ jq non installato (necessario per alcuni script)${NC}"
    echo "  Installa con: sudo apt install jq"
    WARNINGS=$((WARNINGS + 1))
fi

# Check git
if command -v git &> /dev/null; then
    echo -e "${GREEN}✓ git installato${NC}"
else
    echo -e "${RED}✗ git NON installato${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

echo -e "${BLUE}[6] Informazioni SD Card${NC}"

# Show mounted devices
echo "Dispositivi di storage montati:"
lsblk | grep -E 'sd[a-z]|mmcblk'

echo ""
echo "Possibili punti di montaggio SD:"
ls -ld /media/$USER/* 2>/dev/null | head -5 || echo "  Nessuna SD montata in /media/$USER/"

echo ""
echo ""
echo "=================================================="
echo "RIEPILOGO"
echo "=================================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ TUTTO OK! Sei pronto per aggiornare la SD card.${NC}"
    echo ""
    echo "Prossimi passi:"
    echo "  1. Inserisci la microSD del Raspberry nel PC"
    echo "  2. Esegui: sudo ./update_sd_card.sh /media/\$USER/rootfs"
    echo ""
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Hai $WARNINGS warning(s), ma puoi procedere.${NC}"
    echo ""
    echo "Prossimi passi:"
    echo "  1. Inserisci la microSD del Raspberry nel PC"
    echo "  2. Esegui: sudo ./update_sd_card.sh /media/\$USER/rootfs"
    echo ""
else
    echo -e "${RED}✗ Hai $ERRORS errore(i) e $WARNINGS warning(s).${NC}"
    echo ""
    echo "RISOLVI GLI ERRORI prima di procedere:"

    if [ "$CURRENT_BRANCH" != "claude/debug-wifi-connection-018mVJrauq5H2iobsu3KK8Y4" ]; then
        echo "  • Cambia branch: git checkout claude/debug-wifi-connection-018mVJrauq5H2iobsu3KK8Y4"
    fi

    if [ ! -f "$SCRIPT_DIR/setup/scripts/generate_psk.py" ]; then
        echo "  • generate_psk.py mancante - verifica di essere sul branch corretto"
    fi

    if [ ! -f "$SCRIPT_DIR/setup/scripts/configure_device.sh" ]; then
        echo "  • configure_device.sh mancante - verifica di essere sul branch corretto"
    fi

    echo ""
fi

echo ""
exit $ERRORS
