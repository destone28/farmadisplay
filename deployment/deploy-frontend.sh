#!/bin/bash
# Deploy FarmaDisplay Frontend

set -e

PROJECT_DIR="/opt/farmadisplay"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BUILD_DIR="$FRONTEND_DIR/dist"
NGINX_ROOT="/var/www/farmadisplay"

echo "=== Deploying FarmaDisplay Frontend ==="

# Navigate to frontend directory
cd $FRONTEND_DIR

# Install dependencies
echo "Installing dependencies..."
npm ci --production=false

# Build for production
echo "Building frontend..."
npm run build

# Copy build to nginx directory
echo "Deploying to nginx..."
sudo mkdir -p $NGINX_ROOT
sudo rm -rf $NGINX_ROOT/*
sudo cp -r $BUILD_DIR/* $NGINX_ROOT/

# Set permissions
sudo chown -R www-data:www-data $NGINX_ROOT

# Reload nginx
echo "Reloading nginx..."
sudo systemctl reload nginx

# Check nginx status
sudo systemctl status nginx --no-pager

echo ""
echo "=== Frontend deployment completed! ==="
