# FarmaDisplay - Deployment

Scripts e configurazioni per il deployment su server di produzione (Hetzner VPS).

## 🎯 Overview

Questo directory contiene tutti gli script necessari per:

- Setup iniziale server
- Deployment backend FastAPI
- Deployment frontend React
- Configurazione Nginx
- Backup database
- Systemd services

## 🖥️ Server Requirements

### Recommended (Hetzner CX21)

- **CPU**: 2 vCPU AMD
- **RAM**: 4 GB
- **Storage**: 40 GB SSD
- **OS**: Ubuntu 22.04 LTS
- **Network**: 20 TB traffic
- **Cost**: ~€5.83/month

### Minimum

- 1 vCPU
- 2 GB RAM
- 20 GB SSD
- Ubuntu 20.04+

## 🚀 Initial Setup

### 1. Create VPS

1. Create account su [Hetzner](https://www.hetzner.com/)
2. Create new Cloud Server (CX21)
3. Select Ubuntu 22.04
4. Add SSH key
5. Create server

### 2. First Connection

```bash
# SSH into server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y
```

### 3. Run Setup Script

```bash
# Clone repository
cd /opt
git clone https://github.com/destone28/farmadisplay.git
cd farmadisplay/deployment

# Make scripts executable
chmod +x *.sh

# Run setup
./server-setup.sh
```

This will install:
- Python 3.11
- PostgreSQL 15 + PostGIS
- Redis 7
- Nginx
- Certbot (Let's Encrypt)
- Node.js 20

### 4. Configure Database

```bash
# Change default password
sudo -u postgres psql

postgres=# ALTER USER farmadisplay WITH PASSWORD 'your-secure-password';
postgres=# \q
```

### 5. Configure Backend

```bash
cd /opt/farmadisplay/backend

# Create .env file
cp .env.example .env
nano .env

# Update these values:
# DATABASE_URL=postgresql://farmadisplay:your-password@localhost/farmadisplay
# SECRET_KEY=<generate with: openssl rand -hex 32>
# ALLOWED_ORIGINS=["https://yourdomain.com"]
```

### 6. Configure Frontend

```bash
cd /opt/farmadisplay/frontend

# Create .env.production
cp .env.example .env.production
nano .env.production

# Update:
# VITE_API_URL=https://yourdomain.com
```

## 📦 Deployment

### Deploy Backend

```bash
cd /opt/farmadisplay/deployment
./deploy-backend.sh
```

This will:
- Create Python virtual environment
- Install dependencies
- Run database migrations
- Restart systemd service

### Deploy Frontend

```bash
cd /opt/farmadisplay/deployment
./deploy-frontend.sh
```

This will:
- Install npm dependencies
- Build React app
- Copy to nginx directory
- Reload nginx

## 🌐 Nginx Configuration

### Install Configuration

```bash
# Copy nginx config
sudo cp nginx/farmadisplay.conf /etc/nginx/sites-available/

# Update domain name
sudo nano /etc/nginx/sites-available/farmadisplay.conf
# Replace 'yourdomain.com' with your actual domain

# Enable site
sudo ln -s /etc/nginx/sites-available/farmadisplay.conf /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### SSL Certificate (Let's Encrypt)

```bash
# Install certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certificate auto-renewal is handled by certbot timer
sudo systemctl status certbot.timer
```

## 🔧 Systemd Services

### Install Services

```bash
# Copy service files
sudo cp systemd/*.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable farmadisplay-api
sudo systemctl enable farmadisplay-celery

# Start services
sudo systemctl start farmadisplay-api
sudo systemctl start farmadisplay-celery

# Check status
sudo systemctl status farmadisplay-api
sudo systemctl status farmadisplay-celery
```

### Service Management

```bash
# Restart backend
sudo systemctl restart farmadisplay-api

# View logs
sudo journalctl -u farmadisplay-api -f

# Stop service
sudo systemctl stop farmadisplay-api
```

## 💾 Database Backups

### Manual Backup

```bash
cd /opt/farmadisplay/deployment
./backup-database.sh
```

Backups are stored in `/opt/farmadisplay/backups/`

### Automatic Backups

```bash
# Add to crontab
crontab -e

# Add this line for daily backup at 2 AM
0 2 * * * /opt/farmadisplay/deployment/backup-database.sh

# Add this line for weekly backup on Sunday at 3 AM
0 3 * * 0 /opt/farmadisplay/deployment/backup-database.sh
```

### Restore Backup

```bash
# List backups
ls -lh /opt/farmadisplay/backups/

# Restore specific backup
gunzip < /opt/farmadisplay/backups/farmadisplay_20250115_020000.sql.gz | psql -U farmadisplay farmadisplay
```

## 📊 Monitoring

### Check Service Status

```bash
# Backend API
sudo systemctl status farmadisplay-api

# Celery worker
sudo systemctl status farmadisplay-celery

# Nginx
sudo systemctl status nginx

# PostgreSQL
sudo systemctl status postgresql

# Redis
sudo systemctl status redis
```

### View Logs

```bash
# Backend logs
sudo journalctl -u farmadisplay-api -f

# Nginx access logs
sudo tail -f /var/log/nginx/farmadisplay_access.log

# Nginx error logs
sudo tail -f /var/log/nginx/farmadisplay_error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### Resource Usage

```bash
# CPU and memory
htop

# Disk usage
df -h

# Network connections
ss -tulpn
```

## 🔒 Security

### Firewall

```bash
# Check UFW status
sudo ufw status

# The setup script already configured:
# - Port 22 (SSH)
# - Port 80 (HTTP)
# - Port 443 (HTTPS)
```

### SSH Hardening

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Recommended changes:
# PermitRootLogin no
# PasswordAuthentication no
# Port 2222  # Change default port

# Restart SSH
sudo systemctl restart sshd
```

### Database Security

```bash
# PostgreSQL should only listen on localhost
sudo nano /etc/postgresql/15/main/postgresql.conf

# Ensure this line:
# listen_addresses = 'localhost'
```

## 🔄 Updates

### Update Backend

```bash
cd /opt/farmadisplay
git pull origin main
cd deployment
./deploy-backend.sh
```

### Update Frontend

```bash
cd /opt/farmadisplay
git pull origin main
cd deployment
./deploy-frontend.sh
```

### System Updates

```bash
sudo apt update
sudo apt upgrade -y
sudo reboot  # If kernel updated
```

## 🐛 Troubleshooting

### API not responding

```bash
# Check service status
sudo systemctl status farmadisplay-api

# Check logs
sudo journalctl -u farmadisplay-api -n 100

# Restart service
sudo systemctl restart farmadisplay-api
```

### Database connection errors

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U farmadisplay -h localhost -d farmadisplay

# Check credentials in .env
cat /opt/farmadisplay/backend/.env | grep DATABASE_URL
```

### Nginx errors

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

### Out of memory

```bash
# Check memory usage
free -m

# Check processes
ps aux --sort=-%mem | head

# Consider upgrading to CX31 (8GB RAM)
```

## 📈 Performance Optimization

### PostgreSQL Tuning

```bash
sudo nano /etc/postgresql/15/main/postgresql.conf

# For 4GB RAM server (CX21):
# shared_buffers = 1GB
# effective_cache_size = 3GB
# maintenance_work_mem = 256MB
# work_mem = 16MB

sudo systemctl restart postgresql
```

### Nginx Tuning

```bash
sudo nano /etc/nginx/nginx.conf

# worker_processes auto;
# worker_connections 1024;
# keepalive_timeout 65;

sudo systemctl reload nginx
```

### Redis Tuning

```bash
sudo nano /etc/redis/redis.conf

# maxmemory 256mb
# maxmemory-policy allkeys-lru

sudo systemctl restart redis
```

## 📝 License

MIT License - see [LICENSE](../LICENSE)
