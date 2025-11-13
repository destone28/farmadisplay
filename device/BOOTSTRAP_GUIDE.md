# FarmaDisplay - Guida Bootstrap Raspberry Pi Zero 2 W

Guida completa per l'installazione e configurazione automatica di Raspberry Pi Zero 2 W con FullPageOS per FarmaDisplay.

---

## 📋 Indice

1. [Panoramica Sistema](#panoramica-sistema)
2. [Requisiti Hardware](#requisiti-hardware)
3. [Preparazione SD Card](#preparazione-sd-card)
4. [Installazione Bootstrap](#installazione-bootstrap)
5. [Configurazione via Bluetooth](#configurazione-via-bluetooth)
6. [Struttura File e Script](#struttura-file-e-script)
7. [Flusso Completo](#flusso-completo)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

---

## 🎯 Panoramica Sistema

Il sistema di bootstrap automatico per FarmaDisplay consente di configurare un Raspberry Pi Zero 2 W al primo avvio tramite Bluetooth, senza necessità di tastiera, mouse o configurazione manuale.

### Caratteristiche Principali

- ✅ **Configurazione Zero-Touch**: Nessuna configurazione manuale necessaria
- ✅ **Bluetooth Setup**: Configurazione completa via smartphone
- ✅ **Auto-Configuration**: WiFi e URL configurati automaticamente
- ✅ **FullPageOS Integration**: Integrazione nativa con FullPageOS
- ✅ **One-Time Setup**: Il bootstrap si esegue solo al primo avvio
- ✅ **Fail-Safe**: Backup automatico delle configurazioni

### Come Funziona

```
┌─────────────────────────────────────────────────────────┐
│  1. Primo avvio → Bootstrap attivo                      │
│  2. Bluetooth discoverable "FarmaDisplay Setup"         │
│  3. Smartphone invia JSON di configurazione             │
│  4. WiFi e URL configurati automaticamente              │
│  5. Reboot → Display farmacia operativo                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Requisiti Hardware

### Hardware Necessario

- **Raspberry Pi Zero 2 W** (con Bluetooth e WiFi integrati)
- **MicroSD Card** 8GB+ (Class 10 o superiore)
- **Alimentatore** 5V 2.5A con microUSB
- **Display HDMI** con cavo HDMI/mini-HDMI
- **Smartphone Android/iOS** per configurazione Bluetooth

### Hardware Opzionale

- Adattatore Ethernet USB (per configurazione alternativa)
- Tastiera USB (solo per troubleshooting)
- Case per Raspberry Pi

---

## 💾 Preparazione SD Card

### 1. Download FullPageOS

Scarica l'ultima versione di FullPageOS:

```bash
# Vai su https://github.com/guysoft/FullPageOS/releases
# Scarica il file .img.zip per Raspberry Pi
```

**Link diretto**: [FullPageOS Releases](https://github.com/guysoft/FullPageOS/releases)

### 2. Flash SD Card

Usa **Raspberry Pi Imager** o **Balena Etcher**:

#### Con Raspberry Pi Imager:

```bash
# 1. Scarica Raspberry Pi Imager
# https://www.raspberrypi.com/software/

# 2. Seleziona:
#    - OS: "Use custom" → Seleziona FullPageOS .img
#    - Storage: La tua SD card
#    - Write

# 3. IMPORTANTE: NON configurare WiFi nelle impostazioni avanzate
#    (sarà configurato automaticamente dal bootstrap)
```

#### Con Balena Etcher:

```bash
# 1. Scarica Balena Etcher
# https://www.balena.io/etcher/

# 2. Select image: FullPageOS .img file
# 3. Select target: SD card
# 4. Flash!
```

### 3. Abilita SSH (Opzionale ma Raccomandato)

Prima di rimuovere la SD card:

```bash
# Monta la partizione boot
# Su Linux/Mac:
cd /Volumes/boot  # o /media/boot

# Crea file ssh vuoto
touch ssh

# Su Windows:
# Crea un file chiamato "ssh" (senza estensione) nella partizione boot
```

### 4. Rimuovi SD Card

Espelli in sicurezza la SD card e tienila pronta per l'installazione bootstrap.

---

## 🚀 Installazione Bootstrap

### Opzione A: Installazione via SSH (Raccomandato)

#### 1. Primo Boot di FullPageOS

```bash
# 1. Inserisci SD card nel Raspberry Pi
# 2. Collega HDMI e alimentazione
# 3. Attendi il boot completo (5-10 minuti al primo avvio)
# 4. Chromium si aprirà con una pagina di default
```

#### 2. Connessione SSH

FullPageOS crea un hotspot WiFi al primo avvio se non trova reti configurate:

```bash
# Opzione 1: Connettiti al WiFi hotspot del Pi
SSID: FullPageOS
Password: raspberry

# Opzione 2: Collega ethernet (se disponibile)

# SSH nel Pi
ssh pi@fullpageos.local
# Password: raspberry
```

#### 3. Trasferisci File Bootstrap

Sul tuo computer, dalla directory del progetto:

```bash
# Comprimi la directory device
cd /path/to/farmadisplay
tar -czf device-bootstrap.tar.gz device/

# Trasferisci al Raspberry Pi
scp device-bootstrap.tar.gz pi@fullpageos.local:/home/pi/

# SSH nel Pi
ssh pi@fullpageos.local

# Decomprimi
cd /home/pi
tar -xzf device-bootstrap.tar.gz
```

#### 4. Esegui Installazione

```bash
# Nel Raspberry Pi (via SSH)
cd /home/pi/device
sudo bash install_bootstrap.sh
```

Lo script installerà:
- Dipendenze di sistema (Bluetooth, Python, etc.)
- Script Python di bootstrap
- Systemd service
- Configurazione Bluetooth

Output atteso:
```
🚀 Installing FarmaDisplay Bootstrap System...
✓ Running with root privileges
📦 Installing system dependencies...
✓ System dependencies installed
🐍 Installing Python packages...
✓ Python packages installed
📁 Creating directory structure...
✓ Directories created
📜 Installing bootstrap scripts...
✓ Bootstrap scripts installed
🔧 Installing systemd service...
✓ Systemd service installed
📡 Enabling Bluetooth...
✓ Bluetooth enabled
✅ BOOTSTRAP SYSTEM INSTALLED SUCCESSFULLY
```

#### 5. Riavvia per Attivare Bootstrap

```bash
sudo reboot
```

---

### Opzione B: Installazione Manuale (Senza SSH)

Se non puoi usare SSH, puoi preparare la SD card direttamente:

```bash
# 1. Dopo aver flashato FullPageOS, PRIMA di rimuovere la SD card
# 2. Monta la partizione root (non boot, ma la partizione Linux ext4)

# Su Linux:
sudo mount /dev/sdX2 /mnt  # Sostituisci sdX con il tuo device

# 3. Copia i file bootstrap
sudo cp -r device/scripts/* /mnt/usr/local/bin/
sudo cp device/systemd/farmadisplay-bootstrap.service /mnt/etc/systemd/system/
sudo chmod +x /mnt/usr/local/bin/*.py

# 4. Crea systemd link per abilitare il servizio
sudo ln -s /mnt/etc/systemd/system/farmadisplay-bootstrap.service \
            /mnt/etc/systemd/system/multi-user.target.wants/

# 5. Smonta e inserisci nel Pi
sudo umount /mnt
```

---

## 📱 Configurazione via Bluetooth

### 1. Primo Boot con Bootstrap Attivo

Dopo il reboot, il Raspberry Pi:

1. ✅ Attiva il Bluetooth
2. ✅ Si rende discoverable come **"FarmaDisplay Setup"**
3. ✅ Attende connessione Bluetooth
4. ⏳ Rimane in attesa della configurazione

**Indicatori visivi**:
- Display mostra pagina FullPageOS di default
- Bluetooth LED lampeggia (se presente sul modello)
- Dispositivo visibile in scansione Bluetooth

### 2. Preparazione File di Configurazione

Dalla dashboard FarmaDisplay, nella tab **"Configurazione"**, genera il JSON per il display.

Il JSON avrà questa struttura:

```json
{
  "pharmacy_name": "Farmacia Centrale",
  "pharmacy_id": "c470809e-14be-42c0-ac9c-0d2e2914e33f",
  "display_id": "3ri8zb",
  "wifi_ssid": "Nome_Tua_Rete_WiFi",
  "wifi_password": "Password_WiFi",
  "display_url": "https://yourdomain.com/display/3ri8zb",
  "generated_at": "2025-11-13T14:12:38.620820"
}
```

**📝 Nota**: Salva questo JSON come file di testo sul tuo smartphone.

### 3. Connessione Bluetooth da Smartphone

#### Su Android

**Metodo 1: App Bluetooth Terminal** (Raccomandato)

1. Installa **"Serial Bluetooth Terminal"** dal Play Store
2. Apri l'app
3. Menu → **Devices** → **Scan**
4. Seleziona **"FarmaDisplay Setup"**
5. Connetti
6. Riceverai un messaggio di benvenuto:
   ```json
   {
     "status": "ready",
     "message": "FarmaDisplay Configuration Server",
     "version": "1.0"
   }
   ```
7. Copia il JSON di configurazione
8. Incolla e invia
9. Riceverai conferma:
   ```json
   {
     "status": "success",
     "message": "Configuration applied successfully",
     "pharmacy_name": "Farmacia Centrale",
     "display_id": "3ri8zb",
     "wifi_ssid": "Nome_Rete",
     "display_url": "https://..."
   }
   ```

**Metodo 2: Script Python** (Avanzato)

```python
# smartphone_send_config.py
import bluetooth
import json

# Cerca il dispositivo
nearby_devices = bluetooth.discover_devices(lookup_names=True)
farmadisplay = None

for addr, name in nearby_devices:
    if "FarmaDisplay" in name:
        farmadisplay = (addr, name)
        break

if not farmadisplay:
    print("FarmaDisplay non trovato")
    exit(1)

# Connetti
sock = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
sock.connect((farmadisplay[0], 1))

# Ricevi welcome
welcome = sock.recv(1024)
print(f"Ricevuto: {welcome.decode()}")

# Carica configurazione
with open('config.json', 'r') as f:
    config = json.load(f)

# Invia configurazione
sock.send(json.dumps(config).encode('utf-8'))

# Ricevi risposta
response = sock.recv(1024)
print(f"Risposta: {response.decode()}")

sock.close()
```

#### Su iOS

iOS ha restrizioni Bluetooth più stringenti. Opzioni:

1. **App Bluetooth LE** come "LightBlue Explorer"
2. **Hotspot WiFi** del Raspberry Pi + configurazione via browser
3. **Configurazione Ethernet** se disponibile adattatore

### 4. Reboot Automatico

Dopo la configurazione:

1. ✅ Il Raspberry Pi salva la configurazione
2. ✅ Configura WiFi
3. ✅ Aggiorna URL FullPageOS
4. ✅ Si riavvia automaticamente (dopo 5 secondi)

### 5. Verifica Funzionamento

Dopo il reboot:

1. ✅ Il Pi si connette automaticamente al WiFi
2. ✅ FullPageOS carica l'URL configurato
3. ✅ Il display mostra la bacheca della farmacia
4. 🎉 **Configurazione completata!**

---

## 📂 Struttura File e Script

### Directory Structure

```
device/
├── scripts/
│   ├── first_boot_setup.py          # Main bootstrap script
│   ├── bt_config_receiver.py        # Bluetooth receiver
│   ├── configure_fullpageos.py      # FullPageOS configurator
│   ├── bt_wifi_config_server.py     # Legacy WiFi-only config
│   ├── network_healing_daemon.py    # Network failover
│   └── memory_monitor.sh            # Memory watchdog
├── systemd/
│   ├── farmadisplay-bootstrap.service      # Bootstrap service
│   ├── farmadisplay-bt-config.service      # Legacy BT service
│   ├── farmadisplay-network.service        # Network healing
│   └── farmadisplay-watchdog.service       # Memory watchdog
├── fullpageos-config/
│   ├── fullpageos.txt               # FullPageOS config template
│   └── chromium-flags.txt           # Chromium optimization
├── install_bootstrap.sh              # Bootstrap installer
├── install.sh                        # Legacy installer
├── BOOTSTRAP_GUIDE.md               # This guide
└── README.md                        # General device readme
```

### File Installati sul Raspberry Pi

```
/usr/local/bin/
├── first_boot_setup.py              # Bootstrap orchestrator
├── bt_config_receiver.py            # Bluetooth config server
└── configure_fullpageos.py          # System configurator

/etc/systemd/system/
└── farmadisplay-bootstrap.service   # Bootstrap service

/home/pi/.turnotec/
├── config.json                      # Configuration (dopo setup)
└── configured                       # Flag file (dopo setup)

/var/log/
├── farmadisplay-bootstrap.log       # Bootstrap logs
├── farmadisplay-bt-config.log       # Bluetooth logs
└── farmadisplay-config.log          # Configuration logs

/boot/firmware/fullpageos.txt        # FullPageOS config
/etc/wpa_supplicant/wpa_supplicant.conf  # WiFi config
```

---

## 🔄 Flusso Completo

### Diagramma di Flusso Dettagliato

```
┌─────────────────────────────────────────────────────────────┐
│ FASE 1: PREPARAZIONE                                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Flash FullPageOS su SD card                              │
│ 2. Installa bootstrap system (via SSH o manualmente)        │
│ 3. Riavvia Raspberry Pi                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 2: PRIMO BOOT (Automatico)                             │
├─────────────────────────────────────────────────────────────┤
│ • systemd avvia farmadisplay-bootstrap.service              │
│ • Controlla: /home/pi/.turnotec/configured non esiste       │
│ • Condizione verificata → Procede con bootstrap             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 3: ATTIVAZIONE BLUETOOTH (Automatico)                  │
├─────────────────────────────────────────────────────────────┤
│ • hciconfig hci0 up                                         │
│ • hciconfig hci0 piscan (discoverable)                      │
│ • Bluetooth name: "FarmaDisplay Setup"                      │
│ • Server RFCOMM in ascolto su porta automatica              │
│ • LOG: "Waiting for connection from smartphone..."          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 4: CONNESSIONE SMARTPHONE (Manuale)                    │
├─────────────────────────────────────────────────────────────┤
│ • Utente apre app Bluetooth Terminal su smartphone          │
│ • Scansiona dispositivi Bluetooth                           │
│ • Seleziona "FarmaDisplay Setup"                            │
│ • Connette via RFCOMM                                       │
│ • Riceve welcome message (JSON)                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 5: INVIO CONFIGURAZIONE (Manuale)                      │
├─────────────────────────────────────────────────────────────┤
│ • Utente copia JSON da dashboard FarmaDisplay               │
│ • Incolla nel terminal Bluetooth                            │
│ • Invia (fino a 4096 bytes)                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 6: VALIDAZIONE (Automatico)                            │
├─────────────────────────────────────────────────────────────┤
│ • Parse JSON                                                │
│ • Verifica campi obbligatori:                               │
│   - pharmacy_name                                           │
│   - pharmacy_id                                             │
│   - display_id (6 chars, lowercase alphanumeric)            │
│   - wifi_ssid (max 32 chars)                                │
│   - wifi_password (8-63 chars)                              │
│   - display_url (http/https)                                │
│ • Se invalido → Invia errore e termina                      │
│ • Se valido → Procede                                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 7: SALVATAGGIO LOCALE (Automatico)                     │
├─────────────────────────────────────────────────────────────┤
│ • Crea /home/pi/.turnotec/config.json                       │
│ • Aggiunge metadata:                                        │
│   - configured_at: timestamp                                │
│   - configuration_version: "1.0"                            │
│ • chmod 600 (solo root/pi possono leggere)                  │
│ • LOG: "Configuration saved"                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 8: CONFIGURAZIONE WiFi (Automatico)                    │
├─────────────────────────────────────────────────────────────┤
│ • Backup wpa_supplicant.conf → .conf.backup                 │
│ • Scrive nuovo wpa_supplicant.conf:                         │
│   country=IT                                                │
│   network={                                                 │
│     ssid="wifi_ssid"                                        │
│     psk="wifi_password"                                     │
│     key_mgmt=WPA-PSK                                        │
│   }                                                         │
│ • wpa_cli -i wlan0 reconfigure                              │
│ • Attende 5 secondi                                         │
│ • Test connettività: ping 8.8.8.8                           │
│ • LOG: "WiFi configured successfully" (anche se ping fail)  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 9: CONFIGURAZIONE URL (Automatico)                     │
├─────────────────────────────────────────────────────────────┤
│ • Cerca /boot/firmware/fullpageos.txt o /boot/fullpageos.txt│
│ • Backup fullpageos.txt → .txt.backup                       │
│ • mount -o remount,rw /boot                                 │
│ • Modifica linea: FULLPAGEOS_URL=<display_url>              │
│ • mount -o remount,ro /boot                                 │
│ • LOG: "FullPageOS configuration updated"                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 10: RISPOSTA SUCCESSO (Automatico)                     │
├─────────────────────────────────────────────────────────────┤
│ • Invia JSON successo a smartphone:                         │
│   {                                                         │
│     "status": "success",                                    │
│     "message": "Configuration applied successfully",        │
│     "pharmacy_name": "...",                                 │
│     "display_id": "...",                                    │
│     "wifi_ssid": "...",                                     │
│     "display_url": "..."                                    │
│   }                                                         │
│ • Chiude connessione Bluetooth                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 11: FINALIZZAZIONE (Automatico)                        │
├─────────────────────────────────────────────────────────────┤
│ • Crea /home/pi/.turnotec/configured (flag file)            │
│ • hciconfig hci0 noscan (disabilita discoverable)           │
│ • systemctl disable farmadisplay-bootstrap.service          │
│ • LOG: "Device will reboot in 5 seconds..."                 │
│ • sleep 5                                                   │
│ • reboot                                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 12: BOOT FINALE (Automatico)                           │
├─────────────────────────────────────────────────────────────┤
│ • systemd NON avvia bootstrap (condizione fallisce)         │
│ • wpa_supplicant connette al WiFi automaticamente           │
│ • FullPageOS avvia Chromium con URL configurato             │
│ • Display mostra: https://yourdomain.com/display/3ri8zb     │
│ • 🎉 CONFIGURAZIONE COMPLETATA!                              │
└─────────────────────────────────────────────────────────────┘
```

### Tempi Stimati

- **Preparazione SD card**: 10-15 minuti
- **Primo boot FullPageOS**: 5-10 minuti
- **Installazione bootstrap via SSH**: 3-5 minuti
- **Reboot per attivare bootstrap**: 2-3 minuti
- **Configurazione via Bluetooth**: 1-2 minuti
- **Reboot finale**: 2-3 minuti

**Tempo totale**: ~25-40 minuti per setup completo

---

## 🔍 Troubleshooting

### Problema: Dispositivo non visibile in Bluetooth

**Sintomi**:
- Smartphone non trova "FarmaDisplay Setup"
- Nessun dispositivo Bluetooth visibile

**Soluzioni**:

```bash
# 1. SSH nel Raspberry Pi
ssh pi@fullpageos.local

# 2. Verifica servizio bootstrap
sudo systemctl status farmadisplay-bootstrap

# 3. Controlla se configurato
ls -la /home/pi/.turnotec/configured
# Se esiste, il bootstrap non partirà

# 4. Per riconfigurare
sudo rm /home/pi/.turnotec/configured
sudo rm /home/pi/.turnotec/config.json
sudo reboot

# 5. Verifica Bluetooth hardware
sudo hciconfig hci0 up
sudo hciconfig hci0 piscan
sudo hcitool scan

# 6. Controlla log
sudo tail -f /var/log/farmadisplay-bootstrap.log
```

---

### Problema: Configurazione ricevuta ma WiFi non funziona

**Sintomi**:
- Configurazione Bluetooth completata
- Display mostra "No internet connection"
- wlan0 non ha IP address

**Soluzioni**:

```bash
# 1. Verifica configurazione WiFi
sudo cat /etc/wpa_supplicant/wpa_supplicant.conf

# 2. Verifica interfaccia wlan0
ip addr show wlan0
# Dovrebbe avere un indirizzo IP 192.168.x.x

# 3. Test manuale connessione
sudo wpa_cli -i wlan0 status
sudo wpa_cli -i wlan0 reconfigure

# 4. Scansione reti disponibili
sudo iwlist wlan0 scan | grep ESSID

# 5. Test connettività
ping -c 4 8.8.8.8
ping -c 4 google.com

# 6. Riconfigurazione manuale
sudo nano /etc/wpa_supplicant/wpa_supplicant.conf
# Modifica SSID e password
sudo wpa_cli -i wlan0 reconfigure
```

**Possibili cause**:
- Password WiFi errata
- SSID nascosto
- Rete 5GHz (Pi Zero 2 W supporta solo 2.4GHz)
- Autenticazione enterprise (non supportata)

---

### Problema: Display mostra pagina sbagliata

**Sintomi**:
- Display mostra URL di default invece della bacheca
- Chromium apre homepage generica

**Soluzioni**:

```bash
# 1. Verifica configurazione FullPageOS
sudo cat /boot/firmware/fullpageos.txt | grep FULLPAGEOS_URL
# o
sudo cat /boot/fullpageos.txt | grep FULLPAGEOS_URL

# 2. Verifica configurazione salvata
cat /home/pi/.turnotec/config.json

# 3. Riapplica configurazione manualmente
sudo python3 /usr/local/bin/configure_fullpageos.py \
  /home/pi/.turnotec/config.json

# 4. Riavvia Chromium
sudo pkill chromium
# FullPageOS riavvierà automaticamente Chromium

# 5. Verifica URL caricato
ps aux | grep chromium | grep -o 'http[s]*://[^ ]*'
```

---

### Problema: Bootstrap si avvia a ogni boot

**Sintomi**:
- Bluetooth si attiva sempre
- Il sistema chiede sempre configurazione

**Soluzioni**:

```bash
# 1. Verifica flag file
ls -la /home/pi/.turnotec/configured
# Se non esiste, crealo manualmente

# 2. Crea flag manualmente
sudo touch /home/pi/.turnotec/configured
sudo chown pi:pi /home/pi/.turnotec/configured

# 3. Disabilita servizio manualmente
sudo systemctl disable farmadisplay-bootstrap.service
sudo systemctl stop farmadisplay-bootstrap.service

# 4. Verifica condizione systemd
sudo systemctl cat farmadisplay-bootstrap.service
# Deve avere: ConditionPathExists=!/home/pi/.turnotec/configured
```

---

### Problema: JSON non valido

**Sintomi**:
- Smartphone riceve errore "Invalid JSON format"
- Configurazione rifiutata

**Soluzioni**:

```bash
# 1. Valida JSON localmente
# Usa jsonlint.com o validator online

# 2. Verifica caratteri speciali
# Alcuni caratteri possono causare problemi:
#   - Virgolette non standard (" " invece di " ")
#   - Apici singoli al posto di doppi
#   - Spazi o tab extra

# 3. Formato corretto minimo:
{
  "pharmacy_name": "Nome",
  "pharmacy_id": "uuid-valido",
  "display_id": "abc123",
  "wifi_ssid": "WiFi",
  "wifi_password": "Password123",
  "display_url": "http://domain.com/display/abc123",
  "generated_at": "2025-11-13T14:12:38.620820"
}

# 4. Test manuale via file
echo '{"pharmacy_name":...}' > /tmp/test.json
python3 -m json.tool /tmp/test.json
```

---

### Problema: Permessi negati

**Sintomi**:
- Errore "Permission denied" nei log
- File non creati correttamente

**Soluzioni**:

```bash
# 1. Verifica permessi directory
ls -la /home/pi/.turnotec/
sudo chown -R pi:pi /home/pi/.turnotec/
sudo chmod 755 /home/pi/.turnotec/

# 2. Verifica permessi script
ls -la /usr/local/bin/*.py
sudo chmod +x /usr/local/bin/*.py

# 3. Verifica systemd service
sudo systemctl cat farmadisplay-bootstrap.service
# User deve essere root

# 4. Test esecuzione manuale
sudo python3 /usr/local/bin/first_boot_setup.py
```

---

### Comandi Utili per Debug

```bash
# Visualizza log in real-time
sudo tail -f /var/log/farmadisplay-bootstrap.log
sudo journalctl -u farmadisplay-bootstrap -f

# Status servizio
sudo systemctl status farmadisplay-bootstrap

# Restart servizio manualmente
sudo systemctl restart farmadisplay-bootstrap

# Test Bluetooth manuale
sudo python3 /usr/local/bin/bt_config_receiver.py

# Test configurazione manuale
sudo python3 /usr/local/bin/configure_fullpageos.py /tmp/config.json

# Verifica connettività
ping -c 4 8.8.8.8
curl -I https://google.com

# Info sistema
hostnamectl
timedatectl
rfkill list

# Reset completo
sudo rm -rf /home/pi/.turnotec/*
sudo systemctl enable farmadisplay-bootstrap
sudo reboot
```

---

## ❓ FAQ

### 1. Posso riconfigurare un dispositivo già configurato?

**Sì**. Rimuovi il flag file:

```bash
sudo rm /home/pi/.turnotec/configured
sudo reboot
```

Al prossimo boot il bootstrap si riattiverà.

---

### 2. Il WiFi supporta WPA3?

Dipende dal Raspberry Pi OS. FullPageOS basato su Raspbian dovrebbe supportare WPA3 se aggiornato. Usa preferibilmente **WPA2-PSK** per massima compatibilità.

---

### 3. Posso usare Ethernet invece di WiFi?

**Sì**, ma la configurazione WiFi verrà comunque applicata. Se vuoi usare solo Ethernet:

1. Connetti cavo Ethernet
2. Salta la configurazione WiFi (lascia campi vuoti nel JSON)
3. Oppure ignora il bootstrap e configura manualmente

---

### 4. Quanto tempo rimane discoverable il Bluetooth?

Il Bluetooth rimane discoverable **indefinitamente** finché non riceve una configurazione valida. Non c'è timeout.

---

### 5. Posso configurare più display contemporaneamente?

**Sì**, ma devi connetterti a uno alla volta. Ogni dispositivo accetta **una sola connessione Bluetooth** per la configurazione iniziale.

---

### 6. Il display_id può essere cambiato?

Il **display_id** viene generato dal backend e deve corrispondere alla farmacia nel database. **Non modificarlo manualmente** nel JSON.

---

### 7. Cosa succede se il WiFi cade durante il funzionamento?

Il sistema include uno script `network_healing_daemon.py` che monitora la connessione e tenta la riconnessione automatica. Tuttavia, questo è un servizio separato dal bootstrap.

---

### 8. Posso vedere il display senza Raspberry Pi?

**Sì**. L'URL del display (`display_url`) funziona su qualsiasi browser. Apri l'URL su PC, tablet o smartphone per vedere la bacheca.

---

### 9. Come aggiorno la configurazione senza rifare tutto?

Puoi modificare manualmente:

**URL Display**:
```bash
sudo nano /boot/firmware/fullpageos.txt
# Modifica FULLPAGEOS_URL=...
sudo reboot
```

**WiFi**:
```bash
sudo nano /etc/wpa_supplicant/wpa_supplicant.conf
# Modifica ssid e psk
sudo wpa_cli -i wlan0 reconfigure
```

**Configurazione salvata**:
```bash
sudo nano /home/pi/.turnotec/config.json
# Modifica i valori
# Poi riapplica:
sudo python3 /usr/local/bin/configure_fullpageos.py \
  /home/pi/.turnotec/config.json
```

---

### 10. Come faccio un backup della configurazione?

```bash
# Backup completo
sudo tar -czf farmadisplay-backup.tar.gz \
  /home/pi/.turnotec/ \
  /boot/firmware/fullpageos.txt \
  /etc/wpa_supplicant/wpa_supplicant.conf

# Copia su PC
scp pi@fullpageos.local:~/farmadisplay-backup.tar.gz ./

# Restore
scp farmadisplay-backup.tar.gz pi@fullpageos.local:~/
sudo tar -xzf farmadisplay-backup.tar.gz -C /
sudo reboot
```

---

## 📞 Supporto

Per problemi o domande:

- **GitHub Issues**: [farmadisplay/issues](https://github.com/yourusername/farmadisplay/issues)
- **Email**: support@farmadisplay.com
- **Log file**: Allega sempre `/var/log/farmadisplay-*.log` nelle segnalazioni

---

## 📄 Licenza

MIT License - Vedi [LICENSE](../LICENSE)

---

**Versione**: 1.0
**Ultimo aggiornamento**: 2025-11-13
**Autore**: FarmaDisplay Team
