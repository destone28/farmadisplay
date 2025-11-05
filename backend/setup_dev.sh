#!/bin/bash
# Development setup script for FarmaDisplay backend

set -e

echo "=== FarmaDisplay Backend Setup ==="
echo ""

# Check Python version
echo "Checking Python version..."
python3.11 --version || {
    echo "ERROR: Python 3.11 is required"
    exit 1
}

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3.11 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements-dev.txt

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your configuration:"
    echo "   - DATABASE_URL: PostgreSQL connection string"
    echo "   - SECRET_KEY: Generate with: openssl rand -hex 32"
    echo "   - REDIS_URL: Redis connection string"
    echo ""
fi

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start PostgreSQL and Redis"
echo "3. Run: alembic upgrade head"
echo "4. Run: uvicorn app.main:app --reload"
echo "5. Visit: http://localhost:8000/api/docs"
echo ""
