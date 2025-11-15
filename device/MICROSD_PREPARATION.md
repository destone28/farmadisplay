# 📱 Preparazione MicroSD per Raspberry Pi - Guida Completa

## 📋 Panoramica

Questa guida descrive come preparare una microSD per i dispositivi Raspberry Pi che eseguiranno il sistema TurnoTec Display. La microSD preparata includerà:

✅ **FullPageOS** - Sistema operativo ottimizzato per display kiosk
✅ **TurnoTec System** - Sistema completo di gestione bacheca
✅ **WiFi Hotspot** - Configurazione via smartphone
✅ **Remote Control** - Monitoraggio e controllo remoto (v5.0)
✅ **Auto-installation** - Setup automatico al primo avvio

---

## 🎯 Due Modalità di Installazione

### 1️⃣ **Installazione OFFLINE** (Consigliata)
- ✅ **NON** richiede connessione Internet sul Raspberry
- ✅ Installazione più veloce (3-5 minuti)
- ✅ Ideale per deployment in campo
- ⚠️ Richiede download preliminare pacchetti ARM

### 2️⃣ **Installazione ONLINE**
- ⚠️ Richiede cavo Ethernet collegato
- ⚠️ Installazione più lenta (8-12 minuti)
- ✅ Non richiede preparazione preliminare
- ✅ Ideale per test rapidi

---

## 📦 Prerequisiti

### Hardware Necessario

- **PC/Mac** - Per preparare la microSD
- **Lettore microSD** - USB o integrato
- **MicroSD Card** - Minimo 8GB (consigliato 16GB Classe 10)
- **Raspberry Pi Zero 2 W** - Il dispositivo target

### Software Necessario

**Linux/Mac:**
```bash
# Nessun software aggiuntivo richiesto
# Il sistema ha già tutti gli strumenti necessari
```

**Windows:**
```powershell
# Usa WSL2 (Windows Subsystem for Linux)
wsl --install
# Poi segui le istruzioni Linux
```

### Download FullPageOS

Scarica l'immagine FullPageOS da: https://github.com/guysoft/FullPageOS/releases

**Versione consigliata**: FullPageOS 1.0.0 o superiore (Raspberry Pi OS Bookworm)

---

## 🚀 Procedura Completa

### Fase 1: Flash di FullPageOS

#### 1.1 Scarica Balena Etcher

```bash
# Linux (Debian/Ubuntu)
wget https://github.com/balena-io/etcher/releases/download/v1.18.11/balena-etcher_1.18.11_amd64.deb
sudo dpkg -i balena-etcher_1.18.11_amd64.deb

# Mac
brew install --cask balenaetcher

# Windows
# Scarica da: https://etcher.balena.io/
```

#### 1.2 Flash dell'Immagine

1. Apri **Balena Etcher**
2. Seleziona il file `.img.zip` di FullPageOS
3. Seleziona la microSD
4. Clicca **Flash!**
5. Aspetta il completamento (5-10 minuti)

⚠️ **IMPORTANTE**: NON rimuovere la microSD dopo il flash, serve per il passo successivo!

---

### Fase 2: Preparazione Pacchetti (Solo per Modalità OFFLINE)

**Se vuoi l'installazione OFFLINE**, prima di preparare la SD devi scaricare i pacchetti ARM.

#### 2.1 Download Pacchetti ARM

```bash
cd /path/to/farmadisplay/device

# Esegui lo script di download
./download_packages_arm.sh

# Output atteso:
# Downloading ARM packages for Raspberry Pi...
# Package 1/8: hostapd
# Package 2/8: dnsmasq
# ...
# ✓ All packages downloaded successfully!
```

Questo creerà la directory `packages/` con tutti i file `.deb` necessari.

**Dimensione totale**: ~15-20 MB

**Tempo download**: 2-5 minuti (dipende dalla connessione)

#### 2.2 Verifica Pacchetti

```bash
ls -lh packages/

# Output atteso:
# total 18M
# -rw-r--r-- 1 user user 2.1M hostapd_*.deb
# -rw-r--r-- 1 user user 1.8M dnsmasq_*.deb
# -rw-r--r-- 1 user user 450K python3-flask_*.deb
# ...
```

Se vedi i file `.deb`, sei pronto per l'installazione offline!

---

### Fase 3: Preparazione TurnoTec sulla MicroSD

#### 3.1 Esegui Script di Preparazione

```bash
cd /path/to/farmadisplay/device

# Esegui come root
sudo ./prepare_sd.sh
```

#### 3.2 Segui il Wizard Interattivo

**Step 1: Detect SD Card**

```
Available disks:
NAME   SIZE   TYPE   MOUNTPOINT
sdb    14.8G  disk
├─sdb1  256M  part
└─sdb2  14.5G  part

Enter SD card device (e.g., sdb): sdb
```

⚠️ **ATTENZIONE**: Verifica attentamente il device! Selezionare il disco sbagliato può causare perdita di dati.

**Step 2: Conferma**

```
WARNING: This will prepare /dev/sdb
Make sure FullPageOS is already flashed on this SD card!

Continue? (yes/no): yes
```

**Step 3: Copia Files**

Lo script copierà automaticamente:
- ✅ Script di setup
- ✅ Flask web interface
- ✅ Device Agent (remote control)
- ✅ Systemd services
- ✅ Pacchetti ARM (se disponibili)

**Output atteso:**

```
✓ Files copied to /opt/turnotec-installer/
  - Setup scripts and systemd services
  - Device Agent (remote control)
  - Flask web configuration interface
```

**Step 4: Configurazione Boot**

```
✓ FullPageOS configured to show loading page
✓ SSH enabled
✓ WiFi country set to IT
✓ First-boot installer created
✓ First-boot service installed and enabled
```

**Step 5: Finalizzazione**

```
Syncing filesystems (this may take a minute)...
✓ Filesystems synced
✓ Partitions unmounted safely
```

#### 3.3 Riepilogo Finale

**Modalità OFFLINE:**
```
✓ SD Card Preparation COMPLETE!

Summary:
  Installation method: Offline (ARM .deb packages)
  Packages copied: 8 .deb files
  Internet required: NO ✓

Next steps:
1. Remove the SD card from your PC
2. Insert it into the Raspberry Pi Zero 2 W
3. Connect HDMI display
4. Connect power
5. Wait 3-5 minutes for offline installation
6. The display will show configuration instructions
```

**Modalità ONLINE:**
```
⚠️  ETHERNET REQUIRED for online installation!

Next steps:
1. Remove the SD card from your PC
2. Insert it into the Raspberry Pi Zero 2 W
3. CONNECT ETHERNET CABLE
4. Connect HDMI display and power
5. Wait 8-12 minutes for online installation
```

---

## 🎬 Primo Avvio del Raspberry Pi

### 1️⃣ Setup Hardware

**Connessioni Minime:**
```
Raspberry Pi Zero 2 W
├── MicroSD Card (preparata)
├── HDMI Display
└── Power Supply (5V 2.5A)
```

**Connessioni Opzionali:**
```
└── Ethernet Cable (solo se installazione ONLINE)
```

### 2️⃣ Sequenza di Avvio

**0-30 secondi**: Boot iniziale di FullPageOS
- Display mostra logo Raspberry Pi
- Sistema operativo si avvia

**30 secondi - 2 minuti**: Esecuzione First Boot Script
- Display mostra "TurnoTec - Installing..."
- Script di installazione automatico

**2-5 minuti (OFFLINE) / 8-12 minuti (ONLINE)**: Installazione
- Installazione pacchetti
- Configurazione systemd services
- Setup hotspot WiFi
- Avvio device agent
- Configurazione FullPageOS

**Fine installazione**: Riavvio automatico
- Sistema si riavvia
- Display mostra pagina di configurazione

### 3️⃣ Verifica Installazione Riuscita

**Display mostra:**
```
╔══════════════════════════════════════╗
║     TurnoTec Display Setup           ║
╚══════════════════════════════════════╝

Configurazione Dispositivo
==========================

Per configurare questo display:

1. Connetti smartphone al WiFi
   Nome rete: TurnoTec
   Password: Bacheca2025

2. Apri browser e vai a:
   http://192.168.4.1:8080

3. Inserisci Display ID e WiFi
```

Se vedi questa schermata, l'installazione è riuscita! ✅

---

## 🔧 Configurazione del Device

### 1️⃣ Connessione al Hotspot

**Da Smartphone o Laptop:**

1. Apri impostazioni WiFi
2. Cerca rete **"TurnoTec"**
3. Password: **Bacheca2025**
4. Connetti

### 2️⃣ Accesso Web Interface

1. Apri browser
2. Vai a: **http://192.168.4.1:8080**
3. Vedrai il form di configurazione

### 3️⃣ Compilazione Form

**Campi Obbligatori:**

- **Display ID**: Il codice a 6 caratteri assegnato (es: `abc123`)
  - Ottienilo dalla dashboard admin
  - Associa questo device a una bacheca specifica

**Campi Opzionali (se NO Ethernet):**

- **WiFi SSID**: Nome della tua rete WiFi
- **WiFi Password**: Password della rete

**Campo Avanzato:**

- **Domain**: `turnotec.com` (lascia default)

### 4️⃣ Salva e Riavvia

1. Clicca **"Configura Dispositivo"**
2. Aspetta conferma: "Configurazione salvata"
3. Il dispositivo si riavvierà automaticamente (5 secondi)

### 5️⃣ Verifica Display Attivo

Dopo il riavvio (30-60 secondi):
- Il display mostrerà la bacheca configurata
- URL caricato: `https://turnotec.com/display/{display_id}`
- Device agent inizierà a inviare heartbeat

---

## 🔍 Verifica Sistema di Controllo Remoto

### 1️⃣ Verifica Device Online

**Dal Backend Dashboard:**

1. Login come admin
2. Vai su **Bacheca**
3. Seleziona la farmacia configurata
4. Verifica pannello **"Dispositivo Raspberry Pi"**

**Dati visibili:**
- ✅ Status: **Online** (pallino verde)
- ✅ Indirizzo IP
- ✅ Uptime
- ✅ Firmware: v5.0.0
- ✅ Metriche: CPU, RAM, Disco, Temperatura

### 2️⃣ Test Heartbeat

**Su Raspberry Pi:**
```bash
# SSH nel device
ssh pi@192.168.1.xxx

# Verifica log agent
sudo tail -f /var/log/turnotec/agent.log

# Output atteso:
# 2025-11-15 10:00:00 - INFO - Heartbeat sent successfully. Status: online, IP: 192.168.1.100
```

### 3️⃣ Test Riavvio Remoto

**Dal Dashboard:**

1. Clicca **"Riavvia"** nel pannello device
2. Conferma l'azione
3. Verifica messaggio: "Comando di riavvio inviato"

**Su Raspberry Pi:**
```bash
# Controlla log
sudo tail -f /var/log/turnotec/agent.log

# Output atteso:
# 2025-11-15 10:01:00 - INFO - Received 1 command(s) to execute
# 2025-11-15 10:01:00 - INFO - Executing command <uuid>: reboot
# 2025-11-15 10:01:00 - INFO - Rebooting device in 5 seconds...
```

Il device si riavvierà entro 30 secondi (prossimo polling).

---

## 📊 File e Directory sul Device

### Struttura Installata

```
/opt/turnotec/
├── agent/
│   ├── turnotec_agent.py          # Device agent principale
│   └── requirements.txt            # Dipendenze Python
├── scripts/
│   ├── hotspot_manager.sh          # Gestione hotspot WiFi
│   ├── configure_device.sh         # Applicazione configurazione
│   ├── connectivity_monitor.sh     # Monitor connessione
│   └── update_agent.sh             # Aggiornamento agent
├── web/
│   ├── app.py                      # Flask configuration interface
│   └── templates/
│       ├── setup.html              # Form configurazione
│       └── loading.html            # Pagina loading
├── config.json                     # Configurazione device
└── state.json                      # Stato installazione

/var/log/turnotec/
├── agent.log                       # Log device agent
├── hotspot.log                     # Log hotspot manager
└── configure.log                   # Log configurazione

/etc/systemd/system/
├── turnotec-hotspot.service        # Service hotspot
├── turnotec-web.service            # Service web interface
├── turnotec-monitor.service        # Service connectivity monitor
└── turnotec-agent.service          # Service remote control agent
```

### File di Configurazione

**config.json** (dopo configurazione):
```json
{
  "display_id": "abc123",
  "serial_number": "RPI-1000000012345678",
  "mac_address": "b8:27:eb:12:34:56",
  "domain": "turnotec.com",
  "wifi_ssid": "MyNetwork",
  "wifi_password": "mypassword",
  "configured": true,
  "firmware_version": "5.0.0"
}
```

**state.json**:
```json
{
  "installed_at": "2025-11-15T10:00:00+00:00",
  "version": "5.0.0",
  "configured": true,
  "boot_path": "/boot/firmware",
  "offline_install": true,
  "wifi_country": "IT",
  "flask_port": 8080,
  "agent_enabled": true
}
```

---

## 🔧 Troubleshooting

### Problema: SD non riconosciuta dopo prepare_sd.sh

**Sintomo**: Il PC non riconosce più la SD dopo lo script

**Soluzione**:
```bash
# La SD è stata smontata correttamente
# Rimuovi e reinserisci la SD
# Poi può essere usata nel Raspberry Pi
```

### Problema: First boot non completa l'installazione

**Sintomo**: Display bloccato su "Installing..."

**Diagnosi**:
```bash
# SSH nel Raspberry (se possibile)
ssh pi@raspberrypi.local

# Verifica log first boot
sudo tail -n 100 /var/log/turnotec-first-boot.log

# Verifica status service
sudo systemctl status turnotec-firstboot.service
```

**Cause comuni**:
- Internet assente (se modalità ONLINE)
- Pacchetti ARM corrotti (se modalità OFFLINE)
- SD card difettosa

**Soluzione**:
```bash
# Re-flash della SD e riprova
# Verifica integrità pacchetti ARM
cd device
rm -rf packages/
./download_packages_arm.sh
```

### Problema: Hotspot non appare

**Sintomo**: Rete "TurnoTec" non visibile

**Diagnosi**:
```bash
# SSH via Ethernet
ssh pi@raspberrypi.local

# Verifica service hotspot
sudo systemctl status turnotec-hotspot.service

# Verifica log
sudo journalctl -u turnotec-hotspot.service -n 50
```

**Soluzione**:
```bash
# Riavvia hotspot manualmente
sudo systemctl restart turnotec-hotspot.service

# Verifica WiFi non bloccato
sudo rfkill list
sudo rfkill unblock wifi
```

### Problema: Agent non invia heartbeat

**Sintomo**: Device sempre offline nel dashboard

**Diagnosi**:
```bash
# Verifica service agent
sudo systemctl status turnotec-agent.service

# Verifica log
sudo tail -f /var/log/turnotec/agent.log
```

**Soluzione**:
```bash
# Verifica config.json ha device_id
cat /opt/turnotec/config.json

# Se manca device_id, deve essere configurato
# via API backend o manualmente

# Riavvia agent
sudo systemctl restart turnotec-agent.service
```

---

## 📝 Checklist Pre-Deployment

Prima di deployare in produzione, verifica:

- [ ] FullPageOS flashato correttamente
- [ ] Pacchetti ARM scaricati (se modalità offline)
- [ ] prepare_sd.sh eseguito senza errori
- [ ] SD card verificata con sync completo
- [ ] Raspberry Pi si avvia e completa installazione
- [ ] Hotspot "TurnoTec" visibile
- [ ] Configurazione web accessibile
- [ ] Display ID configurato correttamente
- [ ] Display mostra bacheca dopo riavvio
- [ ] Device agent invia heartbeat (verifica dashboard)
- [ ] Metriche visibili nel pannello device
- [ ] Test riavvio remoto funzionante

---

## 🎉 Conclusione

Seguendo questa guida, avrai preparato una microSD completa per il Raspberry Pi con:

✅ Sistema FullPageOS ottimizzato
✅ TurnoTec Display completamente configurabile
✅ WiFi Hotspot per setup facile
✅ Remote Control integrato (v5.0)
✅ Auto-installation al primo boot

La microSD è ora **ready-to-deploy** e può essere inserita in qualsiasi Raspberry Pi Zero 2 W.

**Tempo totale preparazione**: 15-20 minuti
**Tempo deployment singolo device**: 5 minuti

---

## 📚 Riferimenti

- **Documentazione completa**: `/REMOTE_CONTROL_SETUP.md`
- **FullPageOS**: https://github.com/guysoft/FullPageOS
- **Raspberry Pi OS**: https://www.raspberrypi.com/software/
- **TurnoTec GitHub**: https://github.com/destone28/farmadisplay

---

**Versione documento**: 5.0.0
**Ultima modifica**: 2025-11-15
