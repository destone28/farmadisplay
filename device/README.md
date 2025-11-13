# TurnoTec - Device Setup Guide

Sistema di configurazione automatica per display Raspberry Pi con FullPageOS.

## 📋 Indice

- [Hardware Richiesto](#hardware-richiesto)
- [Setup Iniziale](#setup-iniziale)
- [Installazione](#installazione)
- [Configurazione Display](#configurazione-display)
- [Troubleshooting](#troubleshooting)
- [Architettura Sistema](#architettura-sistema)

---

## 🔧 Hardware Richiesto

- **Raspberry Pi Zero 2 W** (512MB RAM)
- **MicroSD Card** 8GB+ (Class 10 o superiore)
- **Alimentatore** 5V 2.5A microUSB
- **Display HDMI** o monitor
- **Cavo micro-HDMI to HDMI**
- **Adattatore Ethernet** (opzionale, per connessione cablata)

---

## 🚀 Setup Iniziale

### 1. Preparazione MicroSD

#### Opzione A: Raspberry Pi Imager (Consigliato)

1. **Scarica Raspberry Pi Imager v1.9.6+**
   - Windows/Mac/Linux: https://www.raspberrypi.com/software/

2. **Flash FullPageOS**
   - Apri Raspberry Pi Imager
   - Click su "Choose OS"
   - Seleziona: `Other specific-purpose OS` → `FullPageOS` → `FullPageOS (Stable 2025-04-01)`
   - Click su "Choose Storage" e seleziona la tua microSD
   - **IMPORTANTE**: Click sull'icona ingranaggio (⚙️) e:
     - ✅ Abilita SSH
     - ✅ Imposta username: `pi` e password personalizzata
     - ❌ NON configurare WiFi (lo faremo dopo)
   - Click "Write" e attendi il completamento

#### Opzione B: Download Manuale

1. **Download FullPageOS**
   ```bash
   wget https://github.com/guysoft/FullPageOS/releases/download/1.0.0/fullpageos-1.0.0.img.xz
   ```

2. **Flash con dd (Linux/Mac)**
   ```bash
   unxz fullpageos-1.0.0.img.xz
   sudo dd if=fullpageos-1.0.0.img of=/dev/sdX bs=4M status=progress
   sudo sync
   ```

3. **Abilita SSH**
   ```bash
   # Monta la partizione boot
   touch /Volumes/boot/ssh  # Mac
   # oppure
   touch /media/user/boot/ssh  # Linux
   ```

### 2. Primo Boot

1. Inserisci la microSD nel Raspberry Pi
2. Connetti il display HDMI
3. Connetti l'alimentazione
4. **Attendi 3-5 minuti** per il primo boot (espansione filesystem)

---

## 📦 Installazione

### Metodo 1: SSH + Git Clone (Consigliato)

```bash
# 1. Connetti via SSH (trova l'IP con: ping turnotec.local o usa router)
ssh pi@turnotec.local
# Password: quella impostata in Raspberry Pi Imager

# 2. Clona il repository
cd /tmp
git clone https://github.com/yourusername/farmadisplay.git
cd farmadisplay/device

# 3. Esegui installazione
sudo chmod +x install.sh
sudo ./install.sh

# 4. Riavvia quando richiesto
sudo reboot
```

### Metodo 2: Copia Manuale via USB

1. **Prepara USB con i file**
   - Copia la cartella `device/` su una chiavetta USB

2. **Sul Raspberry Pi**
   ```bash
   # Monta USB
   sudo mount /dev/sda1 /mnt

   # Copia files
   sudo cp -r /mnt/device /tmp/
   cd /tmp/device

   # Installa
   sudo chmod +x install.sh
   sudo ./install.sh

   # Riavvia
   sudo reboot
   ```

### Cosa fa l'installazione?

L'installazione configura:

- ✅ Hotspot WiFi "TurnoTec" per configurazione iniziale
- ✅ Web server Flask per form di configurazione
- ✅ Monitor di connettività con auto-recovery
- ✅ Servizi systemd per orchestrazione automatica
- ✅ Chromium ottimizzato per 512MB RAM
- ✅ Pagina di istruzioni iniziale

---

## 📱 Configurazione Display

### Passo 1: Visualizza Istruzioni

Dopo il riavvio, il display mostrerà una **pagina di istruzioni** con:
- Credenziali hotspot WiFi
- Passi da seguire per configurazione

### Passo 2: Connetti Smartphone

1. Sul tuo smartphone, vai su **Impostazioni WiFi**
2. Connetti alla rete: **`TurnoTec`**
3. Password: **`Bacheca2025`**

### Passo 3: Apri Form Configurazione

1. Apri il browser dello smartphone
2. Visita: **`http://192.168.4.1`**
3. Si aprirà il form di configurazione

### Passo 4: Compila Form

Il form richiede:

#### Campo Obbligatorio
- **ID Display** (es. `abc123`)
  - L'ID univoco del display fornito dall'amministratore
  - Solo lettere e numeri, minimo 3 caratteri

#### Campi Opzionali (dipende da Ethernet)

##### Se Ethernet NON connesso:
- ⚠️ **WiFi OBBLIGATORIO**
- **Nome Rete WiFi (SSID)**: Nome della tua rete WiFi
- **Password WiFi**: Password della rete WiFi

##### Se Ethernet connesso:
- ✓ **WiFi OPZIONALE**
- Puoi lasciare vuoti i campi WiFi
- Il dispositivo funzionerà solo con Ethernet

### Passo 5: Conferma e Riavvia

1. Click su **"Configura e Riavvia"**
2. Conferma la configurazione nella finestra modale
3. Attendi il completamento (5-10 secondi)
4. Il dispositivo si **riavvierà automaticamente**

### Passo 6: Verifica Funzionamento

Dopo il riavvio:
- Il display mostrerà la **bacheca TurnoTec** con l'ID configurato
- URL visualizzato: `https://turnotec.com/display/{ID_INSERITO}`
- La pagina si aggiornerà automaticamente ogni 60 secondi

---

## 🔍 Troubleshooting

### Display mostra "Configurazione Richiesta" dopo configurazione

**Causa**: Credenziali WiFi errate o rete non disponibile

**Soluzione**:
1. Verifica che la rete WiFi sia attiva e raggiungibile
2. Verifica la password WiFi (maiuscole/minuscole)
3. Riconnetti allo smartphone all'hotspot "TurnoTec"
4. Riconfigura con credenziali corrette

### Non riesco a connettermi all'hotspot "TurnoTec"

**Soluzioni**:

1. **Verifica che hotspot sia attivo**
   ```bash
   ssh pi@turnotec.local
   sudo systemctl status turnotec-hotspot
   ```

2. **Riavvia manualmente hotspot**
   ```bash
   sudo /opt/turnotec/scripts/hotspot_manager.sh restart
   ```

3. **Verifica stato WiFi**
   ```bash
   sudo iw dev wlan0 info
   ```

### Display mostra pagina bianca o errore

**Causa**: Display ID non valido o backend non raggiungibile

**Soluzioni**:

1. **Verifica connettività**
   ```bash
   ssh pi@turnotec.local
   ping turnotec.com
   curl -I https://turnotec.com/display/ID_DISPLAY
   ```

2. **Verifica URL configurato**
   ```bash
   cat /boot/fullpageos.txt | grep FULLPAGEOS_URL
   ```

3. **Verifica log Chromium**
   ```bash
   journalctl -u fullpageos -f
   ```

### Chromium crash o alta memoria

**Causa**: 512MB RAM limite per Chromium

**Soluzioni**:

1. **Verifica flag Chromium**
   ```bash
   cat /boot/chromium-flags.txt
   ```

2. **Aggiungi swap se necessario**
   ```bash
   sudo dphys-swapfile swapoff
   sudo nano /etc/dphys-swapfile
   # Imposta: CONF_SWAPSIZE=512
   sudo dphys-swapfile setup
   sudo dphys-swapfile swapon
   ```

3. **Riavvia Chromium manualmente**
   ```bash
   sudo systemctl restart fullpageos
   ```

### WiFi si disconnette ripetutamente

**Causa**: Segnale debole o interferenze

**Soluzioni**:

1. **Verifica segnale WiFi**
   ```bash
   iw dev wlan0 link
   ```

2. **Verifica log monitor connettività**
   ```bash
   sudo journalctl -u turnotec-monitor -f
   ```

3. **Usa Ethernet** se disponibile (più stabile)

### Hotspot si riattiva da solo

**Causa**: Il monitor ha rilevato 5 tentativi falliti di connessione

**Comportamento corretto**:
- ✅ Hotspot si riattiva **solo se**:
  - WiFi non connesso per 5 tentativi consecutivi
  - E Ethernet **non connesso**

**Verifica**:
```bash
# Controlla stato Ethernet
ip addr show eth0

# Controlla log monitor
sudo tail -f /var/log/turnotec-monitor.log
```

### SSH non funziona

**Soluzioni**:

1. **Verifica SSH abilitato**
   - Controlla che il file `ssh` esista nella boot partition

2. **Trova IP del Raspberry**
   ```bash
   # Scansione rete
   sudo nmap -sn 192.168.1.0/24

   # Oppure controlla nel router
   ```

3. **Usa IP diretto**
   ```bash
   ssh pi@192.168.1.XX
   ```

---

## 🏗️ Architettura Sistema

### Componenti

```
┌─────────────────────────────────────────────────────┐
│              Raspberry Pi Zero 2 W                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │         FullPageOS (Raspbian Lite)         │   │
│  │                                             │   │
│  │  ┌───────────────────────────────────────┐ │   │
│  │  │  Chromium (Kiosk Mode)                │ │   │
│  │  │  - Ottimizzato 512MB RAM              │ │   │
│  │  │  - Mostra: instructions.html o       │ │   │
│  │  │    https://turnotec.com/display/{ID}  │ │   │
│  │  └───────────────────────────────────────┘ │   │
│  │                                             │   │
│  │  ┌───────────────────────────────────────┐ │   │
│  │  │  Systemd Services                     │ │   │
│  │  │                                       │ │   │
│  │  │  • turnotec-hotspot.service          │ │   │
│  │  │    → Gestisce hotspot WiFi           │ │   │
│  │  │                                       │ │   │
│  │  │  • turnotec-setup.service            │ │   │
│  │  │    → Flask web server (port 80)      │ │   │
│  │  │                                       │ │   │
│  │  │  • turnotec-monitor.service          │ │   │
│  │  │    → Monitor connettività            │ │   │
│  │  └───────────────────────────────────────┘ │   │
│  │                                             │   │
│  │  ┌───────────────────────────────────────┐ │   │
│  │  │  Scripts                              │ │   │
│  │  │                                       │ │   │
│  │  │  • hotspot_manager.sh                │ │   │
│  │  │  • configure_device.sh               │ │   │
│  │  │  • connectivity_monitor.sh           │ │   │
│  │  └───────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Network Interfaces:                                │
│  • wlan0: WiFi client / Hotspot                    │
│  • eth0: Ethernet (opzionale)                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Flow di Configurazione

```
┌─────────────┐
│ Primo Boot  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ Configurato?            │
│ (/opt/turnotec/         │
│  config.json exists?)   │
└─────┬─────────────┬─────┘
      │ NO          │ YES
      ▼             ▼
┌─────────────┐  ┌────────────────┐
│ Avvia       │  │ Connetti WiFi  │
│ Hotspot     │  │ o Ethernet     │
│ "TurnoTec"  │  │                │
└──────┬──────┘  └────────┬───────┘
       │                  │
       ▼                  ▼
┌─────────────┐  ┌────────────────┐
│ Mostra      │  │ Mostra Display │
│ instructions│  │ Pubblico       │
│ .html       │  │ turnotec.com   │
└──────┬──────┘  └────────────────┘
       │
       ▼
┌─────────────────────────┐
│ User si connette        │
│ a hotspot da smartphone │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Visita                  │
│ http://192.168.4.1      │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Compila Form:           │
│ - Display ID (required) │
│ - WiFi SSID (optional)  │
│ - WiFi Pass (optional)  │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Conferma                │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ configure_device.sh     │
│ - Salva config.json     │
│ - Aggiorna wpa_suppl.   │
│ - Aggiorna fullpageos   │
│ - Stop hotspot          │
│ - Reboot                │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Riavvio                 │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Display Pubblico Attivo │
│ Monitor connettività    │
└─────────────────────────┘
```

### Monitor Connettività

Il servizio `turnotec-monitor` controlla continuamente:

```
Loop ogni 30 secondi:
  │
  ├─> Ethernet connesso?
  │   └─> SI → OK (reset failure count)
  │
  └─> NO → Controlla WiFi
      │
      ├─> WiFi connesso?
      │   │
      │   ├─> SI → Testa internet
      │   │   │
      │   │   ├─> OK → Reset failure count
      │   │   └─> FAIL → Incrementa counter
      │   │
      │   └─> NO → Incrementa counter
      │       └─> Tenta riconnessione WiFi
      │
      └─> Failure count >= 5?
          └─> SI → Riattiva hotspot
```

---

## 📁 File e Directory

### Struttura Installata

```
/opt/turnotec/
├── config.json              # Configurazione dispositivo
├── state.json               # Stato sistema
├── scripts/
│   ├── hotspot_manager.sh   # Gestione hotspot
│   ├── configure_device.sh  # Applicazione configurazione
│   └── connectivity_monitor.sh  # Monitor connettività
└── web/
    ├── app.py               # Flask server
    └── templates/
        ├── instructions.html  # Pagina istruzioni
        └── setup.html         # Form configurazione

/boot/
├── chromium-flags.txt       # Flag Chromium ottimizzati
└── fullpageos.txt          # Configurazione FullPageOS

/etc/systemd/system/
├── turnotec-hotspot.service
├── turnotec-setup.service
└── turnotec-monitor.service

/var/log/
├── turnotec-hotspot.log
├── turnotec-configure.log
└── turnotec-monitor.log
```

### File Configurazione

#### `/opt/turnotec/config.json`

```json
{
  "display_id": "abc123",
  "domain": "turnotec.com",
  "wifi_ssid": "MyWiFi",
  "wifi_password": "MyPassword",
  "ethernet_fallback": true,
  "configured": true,
  "configured_at": "2025-01-15T10:30:00+00:00"
}
```

---

## 🔐 Sicurezza

### Password Hotspot

- **SSID**: `TurnoTec` (fisso)
- **Password**: `Bacheca2025` (fisso)
- **Encryption**: WPA2-PSK
- **Non mostrata a schermo** per sicurezza

### Accesso SSH

Cambia password di default:
```bash
passwd
```

Disabilita SSH in produzione (opzionale):
```bash
sudo systemctl disable ssh
sudo systemctl stop ssh
```

### WiFi Credentials Storage

Le credenziali WiFi sono salvate in:
- `/etc/wpa_supplicant/wpa_supplicant.conf` (permessi 600)
- `/opt/turnotec/config.json` (permessi 644, root:root)

---

## 🔄 Update e Manutenzione

### Aggiornare Software

```bash
ssh pi@turnotec.local

# Backup configurazione
sudo cp /opt/turnotec/config.json /tmp/config.json.backup

# Pull aggiornamenti
cd /tmp
git clone https://github.com/yourusername/farmadisplay.git
cd farmadisplay/device

# Reinstalla
sudo ./install.sh

# Restore configurazione
sudo cp /tmp/config.json.backup /opt/turnotec/config.json
sudo reboot
```

### Log Monitoring

```bash
# Hotspot
sudo tail -f /var/log/turnotec-hotspot.log

# Configurazione
sudo tail -f /var/log/turnotec-configure.log

# Connettività
sudo tail -f /var/log/turnotec-monitor.log

# Systemd services
sudo journalctl -u turnotec-hotspot -f
sudo journalctl -u turnotec-setup -f
sudo journalctl -u turnotec-monitor -f
```

### Reset Completo

```bash
# Rimuovi configurazione
sudo rm /opt/turnotec/config.json

# Riavvia
sudo reboot

# Il sistema tornerà in modalità setup
```

---

## 📞 Supporto

Per problemi o domande:
- GitHub Issues: https://github.com/yourusername/farmadisplay/issues
- Email: support@turnotec.com

---

## 📄 Licenza

MIT License - Copyright (c) 2025 TurnoTec
