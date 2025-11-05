# FarmaDisplay - Device Setup

Configurazione e script per Raspberry Pi Zero 2 W con FullPageOS.

## 🎯 Overview

Scripts e configurazioni per trasformare un Raspberry Pi in una bacheca elettronica intelligente con:

- **Auto-healing network**: Switch automatico Ethernet/WiFi
- **Bluetooth configuration**: Configurazione WiFi via Bluetooth
- **Memory monitoring**: Watchdog per evitare crash
- **FullPageOS**: Chromium in modalità kiosk

## 📦 Hardware Requirements

- Raspberry Pi Zero 2 W
- MicroSD Card 8GB+ (Class 10)
- Power supply 5V 2.5A
- Display HDMI
- Ethernet adapter (opzionale)
- Bluetooth (integrato nel Pi Zero 2 W)

## 🚀 Quick Start

### 1. Install FullPageOS

1. Download [FullPageOS](https://github.com/guysoft/FullPageOS/releases)
2. Flash su microSD con [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
3. Monta la SD e configura WiFi in `fullpageos-wpa-supplicant.txt`

### 2. First Boot

1. Inserisci SD nel Raspberry Pi
2. Collega display HDMI e alimentazione
3. Attendi il boot (primo avvio può richiedere 5-10 minuti)

### 3. Configure FullPageOS

```bash
# SSH into the Pi (default password: raspberry)
ssh pi@farmadisplay.local

# Copy configuration files
sudo cp fullpageos-config/fullpageos.txt /boot/
sudo cp fullpageos-config/chromium-flags.txt /boot/

# Reboot
sudo reboot
```

### 4. Install FarmaDisplay Scripts

```bash
# Create directory
sudo mkdir -p /opt/farmadisplay/scripts

# Copy scripts
sudo cp scripts/*.py /opt/farmadisplay/scripts/
sudo cp scripts/*.sh /opt/farmadisplay/scripts/
sudo chmod +x /opt/farmadisplay/scripts/*

# Install systemd services
sudo cp systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable farmadisplay-network
sudo systemctl enable farmadisplay-bt-config
sudo systemctl enable farmadisplay-watchdog
sudo systemctl start farmadisplay-network
sudo systemctl start farmadisplay-bt-config
sudo systemctl start farmadisplay-watchdog
```

## 📁 Files

### Scripts

- **network_healing_daemon.py**: Monitora connettività e switch automatico Ethernet/WiFi
- **bt_wifi_config_server.py**: Server Bluetooth per configurazione WiFi via app mobile
- **memory_monitor.sh**: Monitora memoria RAM e riavvia Chromium se necessario

### Systemd Services

- **farmadisplay-network.service**: Network healing daemon
- **farmadisplay-bt-config.service**: Bluetooth configuration server
- **farmadisplay-watchdog.service**: Memory watchdog

### Configuration

- **fullpageos.txt**: Configurazione principale FullPageOS
- **chromium-flags.txt**: Flag Chromium per ottimizzazione

## 🔧 Configuration

### Display URL

Modifica in `fullpageos.txt`:

```bash
FULLPAGEOS_URL=https://yourdomain.com/display
```

### Network Priority

Il network healing daemon prova in ordine:
1. Ethernet (se collegato)
2. WiFi (se configurato)
3. Retry ogni 30 secondi

### Memory Threshold

Modifica in `memory_monitor.sh`:

```bash
MEMORY_THRESHOLD=85  # Restart se uso RAM > 85%
```

## 📱 Bluetooth WiFi Configuration

### Mobile App (TODO)

1. Abilita Bluetooth sul telefono
2. Cerca dispositivi vicini
3. Connetti a "FarmaDisplay WiFi Config"
4. Invia credenziali WiFi in formato JSON:

```json
{
    "ssid": "YourWiFiSSID",
    "password": "YourWiFiPassword"
}
```

### Manual Configuration

```bash
# Edit wpa_supplicant
sudo nano /etc/wpa_supplicant/wpa_supplicant.conf

# Add network
network={
    ssid="YourSSID"
    psk="YourPassword"
}

# Reconfigure
sudo wpa_cli -i wlan0 reconfigure
```

## 🔍 Monitoring

### Check Service Status

```bash
# Network healing
sudo systemctl status farmadisplay-network

# Bluetooth config
sudo systemctl status farmadisplay-bt-config

# Memory watchdog
sudo systemctl status farmadisplay-watchdog
```

### View Logs

```bash
# Network logs
sudo tail -f /var/log/farmadisplay-network.log

# Bluetooth logs
sudo tail -f /var/log/farmadisplay-bt-config.log

# Memory logs
sudo tail -f /var/log/farmadisplay-memory.log

# System journal
sudo journalctl -u farmadisplay-network -f
```

## 🐛 Troubleshooting

### Display not showing

1. Check Chromium is running: `ps aux | grep chromium`
2. Check display URL: `cat /boot/fullpageos.txt | grep URL`
3. Test URL manually: `curl -I https://yourdomain.com/display`

### No network connection

1. Check network status: `ip addr show`
2. Check network daemon: `sudo systemctl status farmadisplay-network`
3. Manual network restart: `sudo systemctl restart dhcpcd`

### High memory usage

1. Check memory: `free -m`
2. Check watchdog: `sudo systemctl status farmadisplay-watchdog`
3. Manually restart Chromium: `sudo pkill chromium`

### SSH not working

1. Enable SSH: Create empty file `ssh` in boot partition
2. Check Pi is on network: `ping farmadisplay.local`
3. Use IP directly: `ssh pi@192.168.1.xxx`

## 🔐 Security

### Change Default Password

```bash
passwd
# Enter new password
```

### Disable SSH (Production)

```bash
sudo systemctl disable ssh
sudo systemctl stop ssh
```

### Firewall (Optional)

```bash
sudo apt install ufw
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
```

## 📊 Performance Optimization

### GPU Memory

In `/boot/config.txt`:

```bash
gpu_mem=256
```

### Disable Unnecessary Services

```bash
sudo systemctl disable bluetooth  # If not using BT config
sudo systemctl disable avahi-daemon
sudo systemctl disable triggerhappy
```

### Overclock (Optional, voids warranty)

In `/boot/config.txt`:

```bash
arm_freq=1200
over_voltage=2
```

## 📝 License

MIT License - see [LICENSE](../LICENSE)
