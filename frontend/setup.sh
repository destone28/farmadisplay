#!/bin/bash

# TurnoTec Frontend Setup Script

set -e

echo "🚀 Setting up TurnoTec Frontend..."

# Check Node.js version
echo "📦 Checking Node.js version..."
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env created from .env.example"
    echo "⚠️  Please edit .env with your configuration"
else
    echo "✅ .env already exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "  1. Edit .env with your API URL (default: http://localhost:8000)"
echo "  2. Start development server: npm run dev"
echo "  3. Open browser: http://localhost:5173"
echo ""
echo "📚 Default credentials:"
echo "  Username: admin"
echo "  Password: Admin123!"
echo ""
