# 🚀 Fix Rapido WiFi - TurnoTec

## ⚠️ Problema
Il Raspberry Pi **non ha il fix installato**. Sta usando la vecchia versione degli script.

## ✅ Soluzione Veloce

### 1️⃣ Accedi al Raspberry Pi
```bash
ssh pi@192.168.4.1
# Password: raspberry (o quella configurata)
```

### 2️⃣ Scarica gli aggiornamenti
```bash
cd ~
git clone https://github.com/destone28/farmadisplay.git
cd farmadisplay
git checkout claude/debug-wifi-connection-018mVJrauq5H2iobsu3KK8Y4
```

### 3️⃣ Esegui l'aggiornamento
```bash
cd device
sudo ./update_device.sh
```

### 4️⃣ Riconfigura WiFi
- Connettiti all'hotspot TurnoTec
- Vai a http://192.168.4.1:8080/
- Inserisci credenziali WiFi (funziona anche con `#QuestaQui23!`)
- Attendi riavvio

### 5️⃣ Verifica
```bash
# Dopo riavvio, connetti via SSH all'IP WiFi
iwconfig wlan0  # Dovrebbe mostrare connessione
```

## 🔍 Diagnostica
```bash
cd ~/farmadisplay/device
sudo ./diagnose.sh
```

## 📚 Istruzioni Dettagliate
Vedi `UPDATE_INSTRUCTIONS.md` per guida completa.

## 🆘 Problemi?
1. Esegui `sudo ./diagnose.sh`
2. Controlla `/var/log/turnotec-configure.log`
3. Verifica che `generate_psk.py` esista in `/opt/turnotec/scripts/`
