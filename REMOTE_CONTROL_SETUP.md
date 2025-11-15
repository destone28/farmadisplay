# Sistema di Controllo Remoto Raspberry Pi - Guida Completa

## 📋 Indice

1. [Panoramica](#panoramica)
2. [Architettura del Sistema](#architettura-del-sistema)
3. [Setup Backend](#setup-backend)
4. [Setup Device (Raspberry Pi)](#setup-device-raspberry-pi)
5. [Setup Frontend](#setup-frontend)
6. [Testing](#testing)
7. [Utilizzo](#utilizzo)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Panoramica

Il sistema di controllo remoto consente agli amministratori di:

- **Monitorare** in tempo reale lo stato dei dispositivi Raspberry Pi
- **Visualizzare** metriche di sistema (CPU, RAM, disco, temperatura)
- **Controllare** i dispositivi da remoto (riavvio, aggiornamento software)
- **Gestire** lo stato online/offline di ogni bacheca

### Funzionalità Principali

✅ **Monitoraggio Real-time**
- Stato online/offline
- Indirizzo IP
- Uptime
- CPU, RAM, Disco (%)
- Temperatura CPU

✅ **Controllo Remoto**
- Riavvio dispositivo
- Aggiornamento software
- Esecuzione comandi custom (admin only)

✅ **Interfaccia Admin**
- Integrata nella pagina Bacheca
- UI/UX coerente con il design esistente
- Auto-refresh ogni 30 secondi

---

## 🏗️ Architettura del Sistema

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
└────────┬────────┘
         │ HTTPS/REST API
         ↓
┌─────────────────┐
│   Backend       │
│   (FastAPI)     │
└────────┬────────┘
         │ PostgreSQL
         ↓
┌─────────────────┐
│   Database      │
│  + Command Queue│
└─────────────────┘
         ↑
         │ Heartbeat (ogni 60s)
         │ Poll Commands (ogni 30s)
         │
┌─────────────────┐
│  Device Agent   │
│  (Python)       │
│  [Raspberry Pi] │
└─────────────────┘
```

### Componenti

1. **Backend API** (`/backend/app/api/v1/devices.py`)
   - Endpoint heartbeat esteso con metriche
   - Endpoint per comandi remoti
   - Sistema di code comandi

2. **Device Agent** (`/device/agent/turnotec_agent.py`)
   - Servizio Python che gira sul Raspberry Pi
   - Invia heartbeat con metriche ogni 60s
   - Esegue comandi ricevuti dal backend

3. **Frontend** (`/frontend/src/components/devices/DeviceControl.tsx`)
   - Componente React per visualizzazione e controllo
   - Integrato nella pagina Bacheca
   - Auto-refresh ogni 30s

4. **Database**
   - Estensione tabella `devices` con campi monitoraggio
   - Nuova tabella `device_commands` per la coda comandi

---

## ⚙️ Setup Backend

### 1. Applicare Migration Database

```bash
cd backend

# Opzione 1: Con Docker (se disponibile)
docker-compose exec backend alembic upgrade head

# Opzione 2: Con virtual environment
source venv/bin/activate
alembic upgrade head

# Opzione 3: Direttamente con Python
python -m alembic upgrade head
```

La migration `2025_11_15_0000-f6g7h8i9j0k1_add_device_remote_monitoring.py` esegue:

- ✅ Aggiunge lo stato `OFFLINE` all'enum `device_status`
- ✅ Aggiunge campi monitoraggio a `devices`:
  - `ip_address` (String(45))
  - `uptime_seconds` (Integer)
  - `cpu_usage` (Float)
  - `memory_usage` (Float)
  - `disk_usage` (Float)
  - `temperature` (Float)
  - `last_heartbeat` (DateTime)
- ✅ Crea enum `command_status`
- ✅ Crea tabella `device_commands`

### 2. Verificare Migration

```bash
# Verificare che la migration è stata applicata
alembic current

# Output atteso:
# f6g7h8i9j0k1 (head)
```

### 3. Verificare Schema Database

```sql
-- Connettiti al database PostgreSQL
psql -U <username> -d turnotec_db

-- Verifica campi aggiunti a devices
\d devices

-- Verifica tabella device_commands
\d device_commands

-- Verifica enum command_status
\dT+ command_status
```

### 4. Riavviare Backend

```bash
# Se usi systemd
sudo systemctl restart turnotec-backend

# Se usi Docker
docker-compose restart backend

# Se sviluppo locale
uvicorn app.main:app --reload
```

---

## 📱 Setup Device (Raspberry Pi)

### Prerequisiti

- Raspberry Pi con FullPageOS installato
- Script `install.sh` aggiornato (versione 5.0.0+)

### 1. Installazione Completa (nuovo dispositivo)

```bash
# Su Raspberry Pi
cd /path/to/farmadisplay/device
sudo ./install.sh
```

Lo script installerà automaticamente:
- ✅ TurnoTec Agent (`/opt/turnotec/agent/turnotec_agent.py`)
- ✅ Dipendenze Python (psutil, requests)
- ✅ Systemd service (`turnotec-agent.service`)
- ✅ Script di update (`/opt/turnotec/scripts/update_agent.sh`)

### 2. Aggiornamento Device Esistente

Se hai già un Raspberry Pi configurato con versione precedente:

```bash
# 1. Copia i nuovi file
sudo mkdir -p /opt/turnotec/agent
sudo cp device/agent/turnotec_agent.py /opt/turnotec/agent/
sudo cp device/agent/requirements.txt /opt/turnotec/agent/
sudo cp device/agent/update_agent.sh /opt/turnotec/scripts/
sudo chmod +x /opt/turnotec/agent/turnotec_agent.py
sudo chmod +x /opt/turnotec/scripts/update_agent.sh

# 2. Installa dipendenze Python
sudo pip3 install -r /opt/turnotec/agent/requirements.txt

# 3. Installa systemd service
sudo cp device/agent/turnotec-agent.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable turnotec-agent.service
sudo systemctl start turnotec-agent.service
```

### 3. Verifica Agent

```bash
# Verifica status service
sudo systemctl status turnotec-agent

# Verifica log
sudo tail -f /var/log/turnotec/agent.log

# Output atteso:
# 2025-11-15 10:00:00 - TurnoTecAgent - INFO - Agent initialized for device <uuid>
# 2025-11-15 10:00:01 - TurnoTecAgent - INFO - Heartbeat sent successfully. Status: online, IP: 192.168.1.100
```

### 4. Configurazione Device

Il device necessita del `device_id` per comunicare con il backend. Questo viene salvato in `/opt/turnotec/config.json` durante la configurazione web.

Esempio `config.json`:

```json
{
  "display_id": "abc123",
  "serial_number": "RPI-1000000012345678",
  "mac_address": "b8:27:eb:12:34:56",
  "domain": "turnotec.com",
  "wifi_ssid": "MyNetwork",
  "wifi_password": "password",
  "configured": true,
  "firmware_version": "5.0.0",
  "device_id": "<uuid-from-backend>"
}
```

**IMPORTANTE**: Il `device_id` deve essere aggiunto manualmente o tramite API di attivazione del device.

---

## 🖥️ Setup Frontend

### 1. Installare Dipendenze

```bash
cd frontend
npm install
```

### 2. Build Frontend

```bash
# Development
npm run dev

# Production
npm run build
```

### 3. Verificare Componenti

I file aggiunti/modificati:

- ✅ `/frontend/src/types/index.ts` - Types estesi con Device e DeviceCommand
- ✅ `/frontend/src/services/deviceService.ts` - Servizio API per device
- ✅ `/frontend/src/components/devices/DeviceControl.tsx` - Componente UI
- ✅ `/frontend/src/pages/BachecaPage.tsx` - Integrazione componente

---

## 🧪 Testing

### Test Backend

#### 1. Test Heartbeat Endpoint

```bash
# Invia heartbeat con metriche
curl -X POST "https://turnotec.com/api/v1/devices/{device_id}/heartbeat" \
  -H "Content-Type: application/json" \
  -d '{
    "serial_number": "RPI-1000000012345678",
    "status": "active",
    "firmware_version": "5.0.0",
    "ip_address": "192.168.1.100",
    "uptime_seconds": 86400,
    "cpu_usage": 25.5,
    "memory_usage": 45.2,
    "disk_usage": 60.0,
    "temperature": 52.3
  }'

# Verifica risposta contiene i dati aggiornati
```

#### 2. Test Comando Reboot

```bash
# Login admin
TOKEN=$(curl -X POST "https://turnotec.com/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' \
  | jq -r '.access_token')

# Invia comando reboot
curl -X POST "https://turnotec.com/api/v1/devices/{device_id}/reboot" \
  -H "Authorization: Bearer $TOKEN"

# Verifica comando creato
curl -X GET "https://turnotec.com/api/v1/devices/{device_id}/commands" \
  -H "Authorization: Bearer $TOKEN"
```

#### 3. Test Polling Comandi

```bash
# Device effettua polling
curl -X POST "https://turnotec.com/api/v1/devices/{device_id}/commands/poll" \
  -H "Content-Type: application/json" \
  -d '{
    "serial_number": "RPI-1000000012345678"
  }'

# Risposta contiene comandi pending
```

#### 4. Test Aggiornamento Stato Comando

```bash
# Device aggiorna stato comando
curl -X PUT "https://turnotec.com/api/v1/devices/commands/{command_id}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "result": "Device rebooted successfully"
  }'
```

### Test Device Agent

#### 1. Test Heartbeat

```bash
# Sul Raspberry Pi, verifica log agent
sudo tail -f /var/log/turnotec/agent.log

# Output atteso ogni 60 secondi:
# 2025-11-15 10:00:00 - INFO - Heartbeat sent successfully. Status: online, IP: 192.168.1.100
```

#### 2. Test Esecuzione Comando

```bash
# 1. Invia comando reboot dal backend (vedi sopra)

# 2. Sul Raspberry Pi, verifica log
sudo tail -f /var/log/turnotec/agent.log

# Output atteso:
# 2025-11-15 10:01:00 - INFO - Received 1 command(s) to execute
# 2025-11-15 10:01:00 - INFO - Executing command <uuid>: reboot
# 2025-11-15 10:01:00 - INFO - Rebooting device in 5 seconds...
# 2025-11-15 10:01:00 - INFO - Command <uuid> status updated to completed
```

#### 3. Test Metriche Sistema

```bash
# Test manuale metriche
python3 /opt/turnotec/agent/turnotec_agent.py

# Output iniziale:
# 2025-11-15 10:00:00 - INFO - Agent initialized for device <uuid>
# 2025-11-15 10:00:01 - INFO - Heartbeat sent successfully. Status: online, IP: 192.168.1.100
```

### Test Frontend

#### 1. Test Visualizzazione Device

1. Login come admin o user
2. Vai a **Bacheca**
3. Seleziona una farmacia
4. Verifica che appaia il pannello "Dispositivo Raspberry Pi"
5. Controlla che mostri:
   - ✅ Stato Online/Offline
   - ✅ Indirizzo IP
   - ✅ Uptime
   - ✅ Firmware version
   - ✅ Ultimo contatto
   - ✅ Metriche (CPU, RAM, Disco, Temperatura) se online

#### 2. Test Pulsante Riavvia

1. Clicca su **Riavvia**
2. Conferma nel dialog
3. Verifica messaggio "Comando di riavvio inviato con successo"
4. Aspetta 5 secondi e verifica auto-refresh

#### 3. Test Auto-refresh

1. Lascia la pagina aperta
2. Verifica che i dati si aggiornino automaticamente ogni 30 secondi
3. L'icona "Aggiorna" non dovrebbe girare continuamente

---

## 📖 Utilizzo

### Workflow Utente Admin

1. **Visualizzare Stato Device**
   - Vai su **Bacheca**
   - Seleziona la farmacia desiderata
   - Il pannello device mostra lo stato in tempo reale

2. **Riavviare Device**
   - Clicca su **Riavvia** nel pannello device
   - Conferma l'azione
   - Il comando viene inviato al device
   - Il device eseguirà il riavvio entro 30 secondi (prossimo polling)

3. **Monitorare Metriche**
   - Le metriche si aggiornano automaticamente ogni 30 secondi
   - Verde: tutto normale
   - Arancione/Rosso: valori critici (es. temperatura > 70°C)

### Interpretazione Metriche

- **CPU Usage**: Percentuale utilizzo processore
  - < 50%: Normale
  - 50-80%: Medio
  - > 80%: Alto (potrebbe indicare problema)

- **Memory Usage**: Percentuale utilizzo RAM
  - < 70%: Normale
  - 70-90%: Medio
  - > 90%: Critico (rischio crash)

- **Disk Usage**: Percentuale utilizzo disco
  - < 80%: OK
  - 80-95%: Attenzione
  - > 95%: Critico (libera spazio)

- **Temperature**: Temperatura CPU in Celsius
  - < 60°C: Normale
  - 60-70°C: Medio
  - > 70°C: Alto (verifica raffreddamento)

---

## 🔧 Troubleshooting

### Device Non Appare Online

**Sintomi**: Il device appare offline anche se il Raspberry è acceso

**Cause possibili**:
1. Agent non avviato
2. Config non completo (manca `device_id`)
3. Problemi di rete

**Soluzioni**:

```bash
# 1. Verifica service agent
sudo systemctl status turnotec-agent

# Se non attivo:
sudo systemctl start turnotec-agent

# 2. Verifica config
cat /opt/turnotec/config.json

# Deve contenere device_id

# 3. Verifica connettività
ping -c 3 turnotec.com

# 4. Verifica log
sudo tail -f /var/log/turnotec/agent.log
```

### Heartbeat Fallisce

**Sintomi**: Errore nei log "Failed to send heartbeat"

**Cause possibili**:
1. Device non registrato nel backend
2. Serial number non corrisponde
3. Problema rete/firewall

**Soluzioni**:

```bash
# 1. Verifica serial number
cat /opt/turnotec/config.json | grep serial_number

# 2. Test heartbeat manuale
curl -X POST "https://turnotec.com/api/v1/devices/{device_id}/heartbeat" \
  -H "Content-Type: application/json" \
  -d '{"serial_number":"<tuo_serial>","status":"active"}'

# 3. Verifica device nel backend
# Login backend e controlla database:
SELECT id, serial_number, status FROM devices WHERE serial_number = '<tuo_serial>';
```

### Comando Non Eseguito

**Sintomi**: Comando inviato ma non eseguito dal device

**Cause possibili**:
1. Device offline durante polling
2. Errore esecuzione comando
3. Permessi insufficienti

**Soluzioni**:

```bash
# 1. Verifica log agent
sudo tail -n 100 /var/log/turnotec/agent.log | grep -i command

# 2. Verifica permessi
# Agent deve girare come root per riavvio
sudo systemctl status turnotec-agent | grep "Main PID"
ps aux | grep <PID>  # Verifica user

# 3. Test manuale comando reboot
sudo reboot  # Deve funzionare
```

### Metriche Non Aggiornate

**Sintomi**: Metriche sempre a 0 o N/A

**Cause possibili**:
1. Dipendenze Python mancanti
2. Errore raccolta metriche

**Soluzioni**:

```bash
# 1. Reinstalla dipendenze
sudo pip3 install --upgrade -r /opt/turnotec/agent/requirements.txt

# 2. Test manuale psutil
python3 << EOF
import psutil
print(f"CPU: {psutil.cpu_percent()}%")
print(f"Memory: {psutil.virtual_memory().percent}%")
print(f"Disk: {psutil.disk_usage('/').percent}%")
EOF

# 3. Riavvia agent
sudo systemctl restart turnotec-agent
```

### Frontend Non Mostra Device

**Sintomi**: Pannello device non appare o mostra errore

**Cause possibili**:
1. Device non associato a farmacia
2. Errore API
3. Permessi insufficienti

**Soluzioni**:

```bash
# 1. Verifica associazione device-farmacia
# Nel backend database:
SELECT d.id, d.serial_number, d.pharmacy_id, p.name
FROM devices d
LEFT JOIN pharmacies p ON d.pharmacy_id = p.id;

# 2. Test API da browser
# Apri DevTools > Network
# Vai su Bacheca
# Verifica chiamata GET /api/v1/devices/?pharmacy_id=<uuid>

# 3. Verifica errori console
# DevTools > Console
# Cerca errori relativi a deviceService
```

---

## 📝 Note Tecniche

### Sicurezza

- Gli endpoint heartbeat e polling comandi **non richiedono autenticazione** per permettere ai device di comunicare
- I device si autenticano tramite `device_id` + `serial_number`
- I comandi "pericolosi" (execute, ssh_tunnel) richiedono **ruolo admin**

### Performance

- Heartbeat: ogni **60 secondi** (configurabile in `HEARTBEAT_INTERVAL`)
- Polling comandi: ogni **30 secondi** (configurabile in `COMMAND_POLL_INTERVAL`)
- Auto-refresh frontend: ogni **30 secondi**
- Device considerato offline dopo **5 minuti** senza heartbeat

### Scalabilità

Il sistema può gestire:
- ✅ Centinaia di device simultanei
- ✅ Migliaia di comandi in coda
- ✅ Polling concorrente senza conflitti

Per ulteriori ottimizzazioni:
- Implementare WebSocket per aggiornamenti real-time
- Aggiungere Redis per cache device status
- Implementare rate limiting su polling

---

## 🎉 Conclusione

Il sistema di controllo remoto è ora completo e funzionante. Per qualsiasi problema o domanda, consulta la sezione [Troubleshooting](#troubleshooting) o i log di sistema.

**Buon monitoraggio! 🚀**
