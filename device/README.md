# FarmaDisplay - Device Setup

Configurazione e script per Raspberry Pi Zero 2 W con FullPageOS.

## 🎯 Overview

Scripts e configurazioni per trasformare un Raspberry Pi in una bacheca elettronica intelligente con:

- **🚀 Zero-Touch Bootstrap**: Configurazione automatica al primo avvio via Bluetooth
- **📱 Smartphone Setup**: Invio configurazione completa da app mobile
- **📡 Auto-healing network**: Switch automatico Ethernet/WiFi
- **💾 Memory monitoring**: Watchdog per evitare crash
- **🖥️ FullPageOS**: Chromium in modalità kiosk fullscreen

## 🆕 Sistema di Bootstrap (Raccomandato)

**Nuovo!** Sistema di configurazione zero-touch per deployment semplificato.

### Vantaggi

✅ **Nessuna configurazione manuale** - Tutto via Bluetooth
✅ **Setup in 5 minuti** - Dalla SD card al display funzionante
✅ **WiFi + URL automatici** - Configurati dal JSON ricevuto
✅ **One-time setup** - Bootstrap si disabilita dopo configurazione
✅ **Fail-safe** - Backup automatico delle configurazioni

### Quick Start Bootstrap

#### Metodo 1: Preparazione SD Card Diretta (Raccomandato)

Se hai accesso alla microSD card e un PC Linux/Mac/Windows con WSL2:

👉 **[Guida Completa: SD_CARD_PREPARATION.md](SD_CARD_PREPARATION.md)** 👈

```bash
# 1. Flash FullPageOS su SD card
# 2. Monta SD card su PC
# 3. Esegui script di preparazione
sudo bash prepare_sd_card.sh /mnt/path/to/sd/rootfs

# 4. Espelli SD card e inserisci nel Raspberry Pi
# 5. Al boot, il dispositivo diventa "FarmaDisplay Setup"
# 6. Invia configurazione via Bluetooth da smartphone
```

**Vantaggi**: Zero SSH, deployment rapido, ideale per produzione.

#### Metodo 2: Installazione via SSH

```bash
# 1. Flash FullPageOS su SD card
# 2. Boot nel Raspberry Pi
# 3. SSH e installa bootstrap
ssh pi@fullpageos.local
cd /home/pi
# Trasferisci i file del progetto, poi:
cd device
sudo bash install_bootstrap.sh

# 4. Reboot
sudo reboot

# 5. Invia configurazione via Bluetooth da smartphone
# Il dispositivo appare come "FarmaDisplay Setup"
```

### 📖 Documentazione Completa Bootstrap

👉 **[Leggi la Guida Completa Bootstrap](BOOTSTRAP_GUIDE.md)** 👈

Include:
- Istruzioni dettagliate passo-passo
- Struttura JSON di configurazione
- Invio configurazione da smartphone
- Troubleshooting completo
- FAQ e best practices

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
ssh pi@turnotec.local

# Copy configuration files
sudo cp fullpageos-config/fullpageos.txt /boot/
sudo cp fullpageos-config/chromium-flags.txt /boot/

# Reboot
sudo reboot
```

### 4. Install TurnoTec Scripts

```bash
# Create directory
sudo mkdir -p /opt/turnotec/scripts

# Copy scripts
sudo cp scripts/*.py /opt/turnotec/scripts/
sudo cp scripts/*.sh /opt/turnotec/scripts/
sudo chmod +x /opt/turnotec/scripts/*

# Install systemd services
sudo cp systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable turnotec-network
sudo systemctl enable turnotec-bt-config
sudo systemctl enable turnotec-watchdog
sudo systemctl start turnotec-network
sudo systemctl start turnotec-bt-config
sudo systemctl start turnotec-watchdog
```

## 📁 Files

### Bootstrap Scripts (Nuovi)

- **first_boot_setup.py**: 🆕 Script principale bootstrap - orchestrazione primo avvio
- **bt_config_receiver.py**: 🆕 Server Bluetooth per ricezione configurazione completa
- **configure_fullpageos.py**: 🆕 Applica configurazione WiFi e URL a FullPageOS
- **install_bootstrap.sh**: 🆕 Installer per sistema bootstrap (via SSH)
- **prepare_sd_card.sh**: 🆕 Prepara SD card con bootstrap pre-installato (senza SSH)

### Legacy Scripts

- **network_healing_daemon.py**: Monitora connettività e switch automatico Ethernet/WiFi
- **bt_wifi_config_server.py**: Server Bluetooth per configurazione WiFi (solo WiFi, deprecato)
- **memory_monitor.sh**: Monitora memoria RAM e riavvia Chromium se necessario

### Systemd Services

- **farmadisplay-bootstrap.service**: 🆕 Servizio bootstrap primo avvio
- **farmadisplay-network.service**: Network healing daemon (ex turnotec-network)
- **farmadisplay-bt-config.service**: Legacy Bluetooth WiFi config
- **farmadisplay-watchdog.service**: Memory watchdog

### Configuration & Documentation

- **fullpageos.txt**: Template configurazione FullPageOS
- **chromium-flags.txt**: Flag Chromium per ottimizzazione
- **BOOTSTRAP_GUIDE.md**: 🆕 Guida completa sistema bootstrap (installazione via SSH)
- **SD_CARD_PREPARATION.md**: 🆕 Guida preparazione SD card diretta (raccomandato)

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

## 📱 Configurazione JSON Bootstrap

### Formato JSON Completo

Il JSON inviato via Bluetooth deve avere questa struttura:

```json
{
  "pharmacy_name": "Farmacia Centrale",
  "pharmacy_id": "c470809e-14be-42c0-ac9c-0d2e2914e33f",
  "display_id": "3ri8zb",
  "wifi_ssid": "NomeRedeWiFi",
  "wifi_password": "PasswordWiFi123",
  "display_url": "https://yourdomain.com/display/3ri8zb",
  "generated_at": "2025-11-13T14:12:38.620820"
}
```

### Campi Obbligatori

| Campo | Descrizione | Validazione |
|-------|-------------|-------------|
| `pharmacy_name` | Nome farmacia | 1-200 caratteri |
| `pharmacy_id` | UUID farmacia | Formato UUID valido |
| `display_id` | ID pubblico display | 6 caratteri (a-z0-9) |
| `wifi_ssid` | Nome rete WiFi | Max 32 caratteri |
| `wifi_password` | Password WiFi | 8-63 caratteri |
| `display_url` | URL display completo | Deve iniziare con http:// o https:// |
| `generated_at` | Timestamp generazione | ISO 8601 format |

### Invio Configurazione da Smartphone

#### Android - Serial Bluetooth Terminal

1. Installa **"Serial Bluetooth Terminal"** dal Play Store
2. Scansiona dispositivi → Connetti a **"FarmaDisplay Setup"**
3. Incolla il JSON completo
4. Invia
5. Riceverai conferma di successo

#### iOS

iOS richiede app specifiche per RFCOMM. Alternative:
- Usa hotspot WiFi del Raspberry Pi
- Configurazione via SSH

### Legacy: Solo WiFi Configuration

Per configurare solo WiFi (vecchio metodo):

```json
{
    "ssid": "YourWiFiSSID",
    "password": "YourWiFiPassword"
}
```

Connetti a "TurnoTec WiFi Config" invece di "FarmaDisplay Setup".

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
sudo systemctl status turnotec-network

# Bluetooth config
sudo systemctl status turnotec-bt-config

# Memory watchdog
sudo systemctl status turnotec-watchdog
```

### View Logs

```bash
# Network logs
sudo tail -f /var/log/turnotec-network.log

# Bluetooth logs
sudo tail -f /var/log/turnotec-bt-config.log

# Memory logs
sudo tail -f /var/log/turnotec-memory.log

# System journal
sudo journalctl -u turnotec-network -f
```

## 🐛 Troubleshooting

### Display not showing

1. Check Chromium is running: `ps aux | grep chromium`
2. Check display URL: `cat /boot/fullpageos.txt | grep URL`
3. Test URL manually: `curl -I https://yourdomain.com/display`

### No network connection

1. Check network status: `ip addr show`
2. Check network daemon: `sudo systemctl status turnotec-network`
3. Manual network restart: `sudo systemctl restart dhcpcd`

### High memory usage

1. Check memory: `free -m`
2. Check watchdog: `sudo systemctl status turnotec-watchdog`
3. Manually restart Chromium: `sudo pkill chromium`

### SSH not working

1. Enable SSH: Create empty file `ssh` in boot partition
2. Check Pi is on network: `ping turnotec.local`
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
