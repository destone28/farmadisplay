#!/bin/bash
###############################################################################
# TurnoTec - Package Download Script
# Downloads .deb packages on Ubuntu 24.04 for offline installation
###############################################################################

set -e

echo "========================================="
echo "TurnoTec - Package Download"
echo "========================================="
echo ""

# Check if running on Ubuntu
if ! grep -q "Ubuntu" /etc/os-release 2>/dev/null; then
    echo "WARNING: This script is designed for Ubuntu 24.04 LTS"
    echo "Current OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2)"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGES_DIR="$SCRIPT_DIR/packages"

# Create packages directory
mkdir -p "$PACKAGES_DIR"

echo "Package download directory: $PACKAGES_DIR"
echo ""

# Required packages for TurnoTec
REQUIRED_PACKAGES=(
    "hostapd"
    "dnsmasq"
    "python3-flask"
    "python3-pip"
    "jq"
    "wireless-tools"
    "iw"
    "curl"
    "net-tools"
)

echo "Packages to download:"
for pkg in "${REQUIRED_PACKAGES[@]}"; do
    echo "  - $pkg"
done
echo ""

# Check if apt-get is available
if ! command -v apt-get &> /dev/null; then
    echo "ERROR: apt-get not found. This script requires Debian/Ubuntu."
    exit 1
fi

# Update package lists
echo "Updating package lists..."
sudo apt-get update -qq

echo ""
echo "========================================="
echo "Downloading Packages"
echo "========================================="
echo ""

# Change to packages directory
cd "$PACKAGES_DIR"

# Download packages with dependencies
for pkg in "${REQUIRED_PACKAGES[@]}"; do
    echo "Downloading: $pkg"
    apt-get download "$pkg" 2>/dev/null || echo "Warning: Could not download $pkg"
done

echo ""
echo "Downloading dependencies..."

# Download dependencies for each package
for pkg in "${REQUIRED_PACKAGES[@]}"; do
    echo "  Dependencies for: $pkg"

    # Get list of dependencies
    DEPS=$(apt-cache depends "$pkg" | grep "Depends:" | awk '{print $2}' | grep -v "<" || true)

    for dep in $DEPS; do
        # Skip if already downloaded
        if ls ${dep}_*.deb 1> /dev/null 2>&1; then
            continue
        fi

        # Download dependency
        apt-get download "$dep" 2>/dev/null || true
    done
done

echo ""
echo "========================================="
echo "Download Complete"
echo "========================================="
echo ""

# Count packages
PKG_COUNT=$(ls -1 *.deb 2>/dev/null | wc -l)

if [ "$PKG_COUNT" -eq 0 ]; then
    echo "ERROR: No packages were downloaded!"
    exit 1
fi

echo "Downloaded $PKG_COUNT .deb packages"
echo "Total size: $(du -sh . | awk '{print $1}')"
echo ""
echo "Packages saved in: $PACKAGES_DIR"
echo ""

# Create package list
echo "Creating package manifest..."
ls -1h *.deb > packages.list
echo "✓ Manifest created: packages.list"
echo ""

# Create verification script
cat > verify_packages.sh <<'EOF'
#!/bin/bash
# Verify all packages are present
echo "Verifying packages..."
MISSING=0
while IFS= read -r pkg; do
    if [ ! -f "$pkg" ]; then
        echo "Missing: $pkg"
        MISSING=$((MISSING + 1))
    fi
done < packages.list

if [ $MISSING -eq 0 ]; then
    echo "✓ All packages present"
    exit 0
else
    echo "✗ $MISSING packages missing"
    exit 1
fi
EOF

chmod +x verify_packages.sh

echo "========================================="
echo "Next Steps:"
echo "========================================="
echo ""
echo "1. Packages are ready in: $PACKAGES_DIR"
echo "2. Run prepare_sd.sh to copy packages to SD card"
echo "3. Packages will be installed offline on first boot"
echo ""
echo "To verify packages: cd $PACKAGES_DIR && ./verify_packages.sh"
echo ""
