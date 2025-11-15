# Istruzioni di Aggiornamento - Fix WiFi

## ⚠️ Problema Identificato

Il Raspberry Pi sta usando la **vecchia versione** degli script che **non gestisce correttamente** le password WiFi con caratteri speciali.

### Cosa non funziona:
- ❌ Password con caratteri speciali (`#`, `!`, `$`, ecc.) causano errori di connessione
- ❌ Il fix implementato non è ancora installato sul dispositivo
- ❌ Lo script `generate_psk.py` non è presente in `/opt/turnotec/scripts/`

### Cosa funzionerà dopo l'aggiornamento:
- ✅ Password con qualsiasi carattere speciale
- ✅ Hash PSK sicuro generato automaticamente
- ✅ Connessione WiFi affidabile

---

## 🛠️ Soluzione: Aggiorna il Raspberry Pi

### Opzione A: Aggiornamento Automatico (Raccomandato)

#### Prerequisiti:
- Accesso SSH al Raspberry Pi o accesso fisico con tastiera/monitor
- I nuovi script nel repository

#### Passi:

1. **Copia i file sul Raspberry Pi**

   Se hai accesso SSH:
   ```bash
   # Sul tuo computer, dalla directory farmadisplay
   scp -r device/setup/scripts/generate_psk.py pi@192.168.4.1:/tmp/
   scp -r device/setup/scripts/configure_device.sh pi@192.168.4.1:/tmp/
   scp device/update_device.sh pi@192.168.4.1:/tmp/
   ```

   Se usi USB/SD card:
   - Copia i file su una chiavetta USB
   - Inserisci nel Raspberry Pi
   - Monta: `sudo mount /dev/sda1 /mnt`
   - Copia: `cp /mnt/* /tmp/`

2. **Esegui lo script di diagnostica (opzionale ma consigliato)**
   ```bash
   ssh pi@192.168.4.1
   cd /tmp
   sudo bash diagnose.sh
   ```

   Questo mostrerà lo stato attuale e confermerà che il fix non è installato.

3. **Esegui lo script di aggiornamento**
   ```bash
   # Sul Raspberry Pi (via SSH o direttamente)
   cd /home/pi/farmadisplay/device  # o dove hai clonato il repo
   sudo ./update_device.sh
   ```

   Output atteso:
   ```
   ==================================
   TurnoTec Device Update Script
   WiFi PSK Fix Installation
   ==================================

   [1/5] Checking current installation...
   ✓ TurnoTec installation found

   [2/5] Backing up current scripts...
   ✓ Backup created at /opt/turnotec/scripts.backup.TIMESTAMP

   [3/5] Installing new generate_psk.py...
   ✓ generate_psk.py installed

   [4/5] Updating configure_device.sh...
   ✓ configure_device.sh updated

   [5/5] Verifying installation...
   ✓ generate_psk.py is working correctly
   ✓ configure_device.sh uses PSK hash generation

   ==================================
   Update completed successfully!
   ==================================
   ```

4. **Riconfigura il WiFi**
   - Connettiti all'hotspot TurnoTec
   - Apri http://192.168.4.1:8080/
   - Inserisci le credenziali WiFi (anche con caratteri speciali!)
   - Attendi il riavvio

5. **Verifica la connessione**
   ```bash
   ssh pi@<IP_WIFI>  # L'IP assegnato dal router WiFi
   iwconfig wlan0     # Dovrebbe mostrare connessione attiva
   ```

---

### Opzione B: Aggiornamento Manuale

Se preferisci aggiornare manualmente:

1. **Accedi al Raspberry Pi**
   ```bash
   ssh pi@192.168.4.1
   # Password predefinita: raspberry (o quella configurata)
   ```

2. **Backup degli script attuali**
   ```bash
   sudo mkdir -p /opt/turnotec/scripts.backup
   sudo cp /opt/turnotec/scripts/* /opt/turnotec/scripts.backup/
   ```

3. **Scarica i nuovi script**

   Metodo Git (se il repo è già sul dispositivo):
   ```bash
   cd /home/pi/farmadisplay
   git fetch origin
   git checkout claude/debug-wifi-connection-018mVJrauq5H2iobsu3KK8Y4
   git pull
   ```

   Oppure copia manualmente:
   ```bash
   # Copia generate_psk.py
   sudo cp /path/to/farmadisplay/device/setup/scripts/generate_psk.py /opt/turnotec/scripts/
   sudo chmod +x /opt/turnotec/scripts/generate_psk.py

   # Copia configure_device.sh aggiornato
   sudo cp /path/to/farmadisplay/device/setup/scripts/configure_device.sh /opt/turnotec/scripts/
   sudo chmod +x /opt/turnotec/scripts/configure_device.sh
   ```

4. **Verifica installazione**
   ```bash
   # Test generate_psk.py
   /opt/turnotec/scripts/generate_psk.py "TestNet" "Test123!"
   # Dovrebbe stampare un hash di 64 caratteri esadecimali

   # Verifica configure_device.sh
   grep "generate_psk.py" /opt/turnotec/scripts/configure_device.sh
   # Dovrebbe trovare riferimenti al nuovo script
   ```

5. **Riconfigura WiFi** (come Opzione A, punto 4)

---

## 🔍 Diagnostica

### Script di diagnostica

Esegui in qualsiasi momento per verificare lo stato:
```bash
cd /home/pi/farmadisplay/device
sudo ./diagnose.sh
```

Questo script controlla:
- ✓ Installazione TurnoTec
- ✓ Presenza e funzionamento di generate_psk.py
- ✓ Versione di configure_device.sh
- ✓ Configurazione wpa_supplicant
- ✓ Stato interfaccia WiFi
- ✓ Log di connessione
- ✓ Stato hotspot

### Log utili

```bash
# Log di configurazione
sudo cat /var/log/turnotec-configure.log

# Log wpa_supplicant
sudo journalctl -u wpa_supplicant -n 50

# Configurazione WiFi attuale
sudo cat /etc/wpa_supplicant/wpa_supplicant.conf

# Stato WiFi
iwconfig wlan0
wpa_cli -i wlan0 status
```

### Verifica se il fix è installato

```bash
# Controlla se generate_psk.py esiste
ls -la /opt/turnotec/scripts/generate_psk.py

# Controlla se configure_device.sh usa il fix
grep "Generating secure PSK hash" /opt/turnotec/scripts/configure_device.sh
```

Se vedi il file e la stringa, il fix è installato ✅

---

## 🐛 Risoluzione Problemi

### Il WiFi ancora non si connette dopo l'aggiornamento

1. **Verifica credenziali**
   - SSID corretto (case-sensitive!)
   - Password corretta
   - Rete WiFi attiva e nel raggio

2. **Controlla wpa_supplicant.conf**
   ```bash
   sudo cat /etc/wpa_supplicant/wpa_supplicant.conf
   ```

   Dovresti vedere:
   ```
   network={
       ssid="TuoSSID"
       psk=<64_caratteri_esadecimali>  # ← Hash, non password in chiaro!
       key_mgmt=WPA-PSK
   }
   ```

3. **Forza riconnessione**
   ```bash
   sudo wpa_cli -i wlan0 reconfigure
   sudo wpa_cli -i wlan0 reassociate
   ```

4. **Riavvia servizi**
   ```bash
   sudo systemctl restart wpa_supplicant
   sudo systemctl restart NetworkManager
   ```

5. **Test con password semplice**
   - Prova con una password senza caratteri speciali
   - Se funziona → il problema era il fix mancante
   - Se non funziona → problema diverso (segnale, credenziali, ecc.)

### L'hotspot si riattiva continuamente

Questo significa che il WiFi non riesce a connettersi. Dopo 5 tentativi falliti, il sistema riattiva automaticamente l'hotspot per permettere la riconfigurazione.

Soluzioni:
- Verifica che il fix sia installato correttamente
- Controlla la potenza del segnale WiFi
- Assicurati che le credenziali siano corrette

### Errore "Failed to generate PSK hash"

Possibili cause:
1. Python3 non installato
   ```bash
   python3 --version
   sudo apt install python3  # se mancante
   ```

2. generate_psk.py non eseguibile
   ```bash
   sudo chmod +x /opt/turnotec/scripts/generate_psk.py
   ```

3. Password non valida (< 8 o > 63 caratteri)
   - Usa una password di 8-63 caratteri

---

## 📞 Supporto

Se hai ancora problemi dopo l'aggiornamento:

1. **Raccogli diagnostica completa**
   ```bash
   sudo ./diagnose.sh > diagnostics.txt 2>&1
   ```

2. **Invia i log**
   - diagnostics.txt
   - /var/log/turnotec-configure.log
   - Output di `journalctl -u wpa_supplicant -n 100`

3. **Informazioni utili**
   - Modello Raspberry Pi
   - Versione FullPageOS
   - Caratteristiche della rete WiFi (WPA2, WPA3, ecc.)
   - Se funziona con password semplice ma non con caratteri speciali

---

## ✅ Checklist Post-Aggiornamento

- [ ] `generate_psk.py` installato in `/opt/turnotec/scripts/`
- [ ] `generate_psk.py` è eseguibile e funzionante
- [ ] `configure_device.sh` aggiornato con il nuovo codice
- [ ] Backup degli script vecchi creato
- [ ] WiFi riconfigurato tramite form web
- [ ] `wpa_supplicant.conf` contiene hash PSK (non password in chiaro)
- [ ] WiFi connesso correttamente
- [ ] Display carica l'URL configurato
- [ ] Sistema stabile senza riavvii dell'hotspot

---

**Nota**: Dopo l'aggiornamento, il sistema gestirà automaticamente qualsiasi password WiFi, indipendentemente dai caratteri speciali presenti. Non sono necessarie altre modifiche manuali.
