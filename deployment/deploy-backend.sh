#!/bin/bash
# Deploy FarmaDisplay Backend

set -e

PROJECT_DIR="/opt/farmadisplay"
BACKEND_DIR="$PROJECT_DIR/backend"
VENV_DIR="$BACKEND_DIR/venv"

echo "=== Deploying FarmaDisplay Backend ==="

# Navigate to backend directory
cd $BACKEND_DIR

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment..."
    python3.11 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Restart systemd service
echo "Restarting backend service..."
sudo systemctl restart farmadisplay-api

# Check service status
sudo systemctl status farmadisplay-api --no-pager

echo ""
echo "=== Backend deployment completed! ==="
