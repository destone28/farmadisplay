# 🚀 TurnoTec - Quick Deployment Guide

**Target:** Production deployment for 100 Raspberry Pi displays

---

## 📦 Server Requirements (15-minute refresh)

```
Provider:   Hetzner CX21 or Contabo VPS S
CPU:        2-3 vCPU
RAM:        4-6 GB
Storage:    40-50 GB SSD NVMe
Bandwidth:  100 GB/month
OS:         Ubuntu 22.04 LTS
Cost:       €5-7/month
```

---

## 🔧 Installation Steps

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3.11 python3.11-venv python3-pip \
    postgresql postgresql-contrib postgis \
    nginx redis-server git curl

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Clone Repository

```bash
cd /opt
sudo git clone https://github.com/destone28/farmadisplay.git turnotec
cd turnotec
sudo chown -R $USER:$USER /opt/turnotec
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://turnotec:YOUR_SECURE_PASSWORD@localhost/turnotec_db

# Security
SECRET_KEY=YOUR_SECRET_KEY_HERE_GENERATE_WITH_openssl_rand_hex_32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:5173","https://yourdomain.com"]

# Redis (optional)
REDIS_URL=redis://localhost:6379/0

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAILS_FROM_EMAIL=noreply@turnotec.com
EMAILS_FROM_NAME=TurnoTec
EOF

# Generate secret key
openssl rand -hex 32
# Copy the output and replace YOUR_SECRET_KEY_HERE in .env
```

### 4. Database Setup

```bash
# Create PostgreSQL user and database
sudo -u postgres psql << EOF
CREATE USER turnotec WITH PASSWORD 'YOUR_SECURE_PASSWORD';
CREATE DATABASE turnotec_db OWNER turnotec;
\c turnotec_db
CREATE EXTENSION postgis;
GRANT ALL PRIVILEGES ON DATABASE turnotec_db TO turnotec;
EOF

# Run migrations
source venv/bin/activate
alembic upgrade head

# Create first superuser (optional - can be done via API)
# python -m app.initial_data
```

### 5. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
VITE_API_URL=https://api.yourdomain.com
EOF

# Build for production
npm run build
# Output will be in: dist/
```

### 6. Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/turnotec
```

**Nginx config:**

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static file uploads
    location /uploads/ {
        alias /opt/turnotec/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /opt/turnotec/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

```bash
# Enable site and restart nginx
sudo ln -s /etc/nginx/sites-available/turnotec /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. SSL/TLS (Let's Encrypt)

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal is enabled by default
sudo systemctl status certbot.timer
```

### 8. Systemd Service for Backend

```bash
sudo nano /etc/systemd/system/turnotec-backend.service
```

**Service file:**

```ini
[Unit]
Description=TurnoTec FastAPI Backend
After=network.target postgresql.service redis.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/opt/turnotec/backend
Environment="PATH=/opt/turnotec/backend/venv/bin"
ExecStart=/opt/turnotec/backend/venv/bin/gunicorn app.main:app \
    --workers 3 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:8000 \
    --timeout 120 \
    --access-logfile /var/log/turnotec/access.log \
    --error-logfile /var/log/turnotec/error.log \
    --log-level info
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Create log directory
sudo mkdir -p /var/log/turnotec
sudo chown www-data:www-data /var/log/turnotec

# Set permissions
sudo chown -R www-data:www-data /opt/turnotec/backend

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable turnotec-backend
sudo systemctl start turnotec-backend

# Check status
sudo systemctl status turnotec-backend
```

---

## 🔍 Verification

### 1. Backend Health Check

```bash
curl https://api.yourdomain.com/health
# Expected: {"status":"healthy"}

curl https://api.yourdomain.com/docs
# Expected: Swagger UI
```

### 2. Frontend Access

```bash
curl https://yourdomain.com
# Expected: HTML response
```

### 3. Database Connection

```bash
sudo -u postgres psql -d turnotec_db -c "SELECT COUNT(*) FROM users;"
```

### 4. Service Logs

```bash
# Backend logs
sudo journalctl -u turnotec-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 👤 Create First Admin User

```bash
cd /opt/turnotec/backend
source venv/bin/activate

# Option 1: Via API endpoint (recommended)
curl -X POST https://api.yourdomain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "SecurePassword123!",
    "full_name": "Admin User"
  }'

# Option 2: Via Python script
python << EOF
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()
user = User(
    email="admin@yourdomain.com",
    hashed_password=get_password_hash("SecurePassword123!"),
    full_name="Admin User",
    is_active=True,
    is_superuser=True
)
db.add(user)
db.commit()
print("Admin user created!")
EOF
```

---

## 🍓 Raspberry Pi Display Setup

### 1. Install FullPageOS

Download from: https://github.com/guysoft/FullPageOS/releases

```bash
# Flash to SD card using Raspberry Pi Imager
# or balenaEtcher
```

### 2. Configure WiFi (Before First Boot)

Edit `fullpageos-wpa-supplicant.txt` on boot partition:

```
country=IT
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
    ssid="YourWiFiNetwork"
    psk="YourWiFiPassword"
    key_mgmt=WPA-PSK
}
```

### 3. Configure Display URL

Edit `fullpageos.txt` on boot partition:

```bash
# Set your display URL
FULLPAGEOS_URL="https://yourdomain.com/display/YOUR_DISPLAY_ID"

# Disable screensaver
FULLPAGEOS_SCREENSAVER="false"

# Auto-refresh (backup to JS refresh)
FULLPAGEOS_AUTOREFRESH="true"
FULLPAGEOS_REFRESH_RATE="900000"  # 15 minutes in ms
```

### 4. First Boot

1. Insert SD card into Raspberry Pi
2. Connect to power
3. Wait 2-3 minutes for first boot
4. Display should automatically show pharmacy information
5. Default SSH access: `ssh pi@fullpageos.local` (password: `raspberry`)

### 5. Optional: Remote Management

```bash
# SSH into Raspberry Pi
ssh pi@fullpageos.local

# Change default password
passwd

# Update system
sudo apt update && sudo apt upgrade -y

# Check browser logs
journalctl -u fullpageos

# Reboot
sudo reboot
```

---

## 📊 Monitoring Setup (Optional but Recommended)

### 1. Install Prometheus & Grafana

```bash
# Install Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
cd prometheus-*
sudo cp prometheus promtool /usr/local/bin/
sudo mkdir -p /etc/prometheus /var/lib/prometheus
sudo cp -r consoles console_libraries /etc/prometheus

# Install Grafana
sudo apt install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo apt update
sudo apt install grafana
sudo systemctl enable grafana-server
sudo systemctl start grafana-server
```

### 2. Monitor Key Metrics

- Backend response times
- Scraping success rate
- Database connection pool
- Server CPU/RAM usage
- Display connectivity (ping checks)

---

## 🔒 Security Hardening

### 1. Firewall Configuration

```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### 2. Fail2ban

```bash
# Install fail2ban
sudo apt install -y fail2ban

# Configure
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
# Set bantime, maxretry, etc.

sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. PostgreSQL Security

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
# listen_addresses = 'localhost'

sudo nano /etc/postgresql/14/main/pg_hba.conf
# local   all             all                                     peer
# host    turnotec_db     turnotec        127.0.0.1/32           md5

sudo systemctl restart postgresql
```

---

## 📅 Maintenance Tasks

### Daily
- Check service status: `sudo systemctl status turnotec-backend`
- Review error logs: `sudo journalctl -u turnotec-backend --since today`

### Weekly
- Monitor disk usage: `df -h`
- Check database size: `sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('turnotec_db'));"`
- Review nginx logs for errors

### Monthly
- Update system packages: `sudo apt update && sudo apt upgrade -y`
- Update Python dependencies: `pip list --outdated`
- Update Node.js dependencies: `npm outdated`
- Review and rotate logs: `sudo logrotate -f /etc/logrotate.conf`

### Quarterly
- Full backup and recovery test
- Security audit (check for CVEs)
- Performance optimization review

---

## 🔄 Backup Strategy

### Database Backup (Automated Daily)

```bash
# Create backup script
sudo nano /opt/turnotec/scripts/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/turnotec/backups/db"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

sudo -u postgres pg_dump turnotec_db | gzip > $BACKUP_DIR/turnotec_db_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: turnotec_db_$DATE.sql.gz"
```

```bash
# Make executable
sudo chmod +x /opt/turnotec/scripts/backup-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add line:
0 2 * * * /opt/turnotec/scripts/backup-db.sh >> /var/log/turnotec/backup.log 2>&1
```

### Restore Database

```bash
gunzip < /opt/turnotec/backups/db/turnotec_db_YYYYMMDD_HHMMSS.sql.gz | sudo -u postgres psql turnotec_db
```

---

## 🆘 Troubleshooting

### Backend not starting

```bash
# Check logs
sudo journalctl -u turnotec-backend -n 100 --no-pager

# Check database connection
sudo -u postgres psql -d turnotec_db -c "SELECT 1;"

# Test manually
cd /opt/turnotec/backend
source venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Scraping failures

```bash
# Check external site accessibility
curl -I https://www.farmaciediturno.org

# Check backend logs for scraping errors
sudo journalctl -u turnotec-backend | grep -i "scraping\|error"

# Test scraping endpoint manually
curl "https://api.yourdomain.com/api/v1/public/pharmacies/scraped?cap=21100&city=Varese&province=VA"
```

### Display not showing content

1. Check display is online: `ping fullpageos.local`
2. SSH into display: `ssh pi@fullpageos.local`
3. Check browser status: `sudo systemctl status fullpageos`
4. Check chromium logs: `journalctl -u fullpageos -n 50`
5. Verify display URL is correct in `/boot/fullpageos.txt`

---

## 📞 Support

**Documentation:** `/opt/turnotec/docs/`
**Repository:** https://github.com/destone28/farmadisplay

**Quick Links:**
- Server Requirements: `SERVER_REQUIREMENTS.md`
- Scraping Analysis: `docs/SCRAPING_FREQUENCY_ANALYSIS.md`
- Implementation Summary: `docs/IMPLEMENTATION_SUMMARY.md`

---

**Last Updated:** 2025-11-15
**Version:** 1.1.0
