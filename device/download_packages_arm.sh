#!/bin/bash
###############################################################################
# TurnoTec - ARM Package Download Script
# Downloads ARM packages for Raspberry Pi using Docker
# Run on Ubuntu 24.04 LTS
###############################################################################

set -e

echo "========================================="
echo "TurnoTec - ARM Package Download"
echo "========================================="
echo ""

# Check if running on Ubuntu
if ! grep -q "Ubuntu" /etc/os-release 2>/dev/null; then
    echo "WARNING: This script is designed for Ubuntu 24.04 LTS"
    echo "Current OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2)"
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGES_DIR="$SCRIPT_DIR/packages"

# Create packages directory
mkdir -p "$PACKAGES_DIR"

echo "Package download directory: $PACKAGES_DIR"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed!"
    echo ""
    echo "Install Docker with:"
    echo "  sudo apt update"
    echo "  sudo apt install -y docker.io"
    echo "  sudo usermod -aG docker \$USER"
    echo "  # Then log out and log back in"
    echo ""
    exit 1
fi

# Check if user can run docker
if ! docker ps &> /dev/null; then
    echo "ERROR: Cannot run Docker commands!"
    echo ""
    echo "Add your user to docker group:"
    echo "  sudo usermod -aG docker \$USER"
    echo "  # Then log out and log back in"
    echo ""
    echo "Or run this script with sudo"
    exit 1
fi

echo "✓ Docker is available"
echo ""

# Required packages for TurnoTec
REQUIRED_PACKAGES=(
    "hostapd"
    "dnsmasq"
    "python3-flask"
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

echo "========================================="
echo "Downloading ARM Packages with Docker"
echo "========================================="
echo ""

# Create temporary Dockerfile
cat > "$PACKAGES_DIR/Dockerfile.tmp" <<'DOCKERFILE'
FROM debian:bookworm

RUN apt-get update && \
    apt-get install -y --download-only \
        hostapd \
        dnsmasq \
        python3-flask \
        jq \
        wireless-tools \
        iw \
        curl \
        net-tools && \
    mkdir -p /packages && \
    cp /var/cache/apt/archives/*.deb /packages/
DOCKERFILE

echo "Building Docker container with Debian Bookworm (ARM)..."
docker build --platform linux/arm/v7 -f "$PACKAGES_DIR/Dockerfile.tmp" -t turnotec-arm-packages "$PACKAGES_DIR" || {
    echo ""
    echo "ERROR: Docker build failed!"
    echo ""
    echo "This might be because:"
    echo "  1. Docker doesn't support ARM emulation"
    echo "  2. You need to install qemu-user-static"
    echo ""
    echo "Install qemu with:"
    echo "  sudo apt-get install -y qemu-user-static"
    echo "  docker run --rm --privileged multiarch/qemu-user-static --reset -p yes"
    echo ""
    exit 1
}

echo ""
echo "Extracting packages from container..."

# Create temporary container and copy packages
CONTAINER_ID=$(docker create --platform linux/arm/v7 turnotec-arm-packages)
docker cp "$CONTAINER_ID:/packages/." "$PACKAGES_DIR/"
docker rm "$CONTAINER_ID" > /dev/null

# Cleanup
rm "$PACKAGES_DIR/Dockerfile.tmp"
docker rmi turnotec-arm-packages > /dev/null

echo ""
echo "========================================="
echo "Download Complete"
echo "========================================="
echo ""

# Count packages
PKG_COUNT=$(ls -1 "$PACKAGES_DIR"/*.deb 2>/dev/null | wc -l)

if [ "$PKG_COUNT" -eq 0 ]; then
    echo "ERROR: No packages were downloaded!"
    exit 1
fi

echo "Downloaded $PKG_COUNT ARM .deb packages"
echo "Total size: $(du -sh "$PACKAGES_DIR" | awk '{print $1}')"
echo ""

# Verify architecture
echo "Verifying ARM architecture..."
SAMPLE_DEB=$(ls "$PACKAGES_DIR"/*.deb | head -1)
ARCH=$(dpkg --info "$SAMPLE_DEB" | grep "Architecture:" | awk '{print $2}')
echo "Package architecture: $ARCH"

if [[ "$ARCH" == "armhf" || "$ARCH" == "arm64" || "$ARCH" == "all" ]]; then
    echo "✓ Correct ARM architecture detected!"
else
    echo "⚠ WARNING: Unexpected architecture: $ARCH"
    echo "Expected: armhf, arm64, or all"
fi

echo ""
echo "Packages saved in: $PACKAGES_DIR"
echo ""

# Create package list
echo "Creating package manifest..."
ls -1h "$PACKAGES_DIR"/*.deb > "$PACKAGES_DIR/packages.list"
echo "✓ Manifest created: packages.list"
echo ""

# Create verification script
cat > "$PACKAGES_DIR/verify_packages.sh" <<'EOF'
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

    # Verify ARM architecture
    echo ""
    echo "Verifying architecture..."
    for deb in *.deb; do
        ARCH=$(dpkg --info "$deb" 2>/dev/null | grep "Architecture:" | awk '{print $2}')
        if [[ "$ARCH" != "armhf" && "$ARCH" != "arm64" && "$ARCH" != "all" ]]; then
            echo "⚠ Wrong architecture in $deb: $ARCH"
            MISSING=$((MISSING + 1))
        fi
    done

    if [ $MISSING -eq 0 ]; then
        echo "✓ All packages have correct ARM architecture"
        exit 0
    fi
fi

echo "✗ $MISSING issues found"
exit 1
EOF

chmod +x "$PACKAGES_DIR/verify_packages.sh"

echo "========================================="
echo "Next Steps:"
echo "========================================="
echo ""
echo "1. Packages are ready in: $PACKAGES_DIR"
echo "2. Run prepare_sd.sh to copy packages to SD card"
echo "3. Raspberry Pi will install packages offline (no internet needed)"
echo ""
echo "To verify packages: cd $PACKAGES_DIR && ./verify_packages.sh"
echo ""
