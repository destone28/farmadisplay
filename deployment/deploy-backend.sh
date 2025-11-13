#!/bin/bash
# Deploy TurnoTec Backend

set -e

PROJECT_DIR="/opt/turnotec"
BACKEND_DIR="$PROJECT_DIR/backend"
VENV_DIR="$BACKEND_DIR/venv"

echo "=== Deploying TurnoTec Backend ==="

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
sudo systemctl restart turnotec-api

# Check service status
sudo systemctl status turnotec-api --no-pager

echo ""
echo "=== Backend deployment completed! ==="
