#!/bin/bash
# FarmaDisplay Server Setup Script
# Sets up Hetzner VPS for production deployment

set -e

echo "=== FarmaDisplay Server Setup ==="
echo ""

# Update system
echo "Updating system packages..."
apt update && apt upgrade -y

# Install dependencies
echo "Installing dependencies..."
apt install -y \
    python3.11 \
    python3.11-venv \
    python3-pip \
    postgresql-15 \
    postgresql-contrib \
    postgis \
    redis-server \
    nginx \
    certbot \
    python3-certbot-nginx \
    git \
    curl \
    wget \
    htop \
    ufw

# Install Node.js 20
echo "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Setup PostgreSQL
echo "Setting up PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE farmadisplay;
CREATE USER farmadisplay WITH ENCRYPTED PASSWORD 'changeme';
GRANT ALL PRIVILEGES ON DATABASE farmadisplay TO farmadisplay;
\c farmadisplay
CREATE EXTENSION postgis;
EOF

# Setup Redis
echo "Setting up Redis..."
systemctl start redis-server
systemctl enable redis-server

# Configure firewall
echo "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Create application directory
echo "Creating application directory..."
mkdir -p /opt/farmadisplay
chown -R $USER:$USER /opt/farmadisplay

# Create log directory
mkdir -p /var/log/farmadisplay
chown -R $USER:$USER /var/log/farmadisplay

echo ""
echo "=== Server setup completed! ==="
echo ""
echo "Next steps:"
echo "1. Clone repository to /opt/farmadisplay"
echo "2. Configure .env files"
echo "3. Run deploy-backend.sh"
echo "4. Run deploy-frontend.sh"
echo "5. Configure SSL with certbot"
