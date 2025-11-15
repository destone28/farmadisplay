# 🔧 Guida Aggiornamento tramite MicroSD

## 📋 Cosa ti serve

- ✅ PC con Ubuntu
- ✅ MicroSD del Raspberry Pi
- ✅ Lettore di schede SD
- ✅ Repository farmadisplay aggiornato

---

## 🚀 Procedura Completa

### Passo 1: Prepara il Repository

Sul tuo PC Ubuntu:

```bash
# Vai nella directory del repository
cd ~/farmadisplay  # o dove hai clonato il repo

# Assicurati di essere sul branch corretto
git fetch origin
git checkout claude/debug-wifi-connection-018mVJrauq5H2iobsu3KK8Y4
git pull origin claude/debug-wifi-connection-018mVJrauq5H2iobsu3KK8Y4

# Verifica di avere i file corretti
ls -la device/setup/scripts/generate_psk.py
ls -la device/setup/scripts/configure_device.sh
ls -la device/update_sd_card.sh

# Dovresti vedere tutti questi file
```

---

### Passo 2: Spegni il Raspberry Pi

```bash
# Se il Raspberry è acceso, spegnilo in modo sicuro
# (se hai accesso alla rete, altrimenti stacca l'alimentazione)
```

---

### Passo 3: Inserisci la MicroSD nel PC

1. **Rimuovi** la microSD dal Raspberry Pi
2. **Inserisci** la microSD nel lettore del tuo PC Ubuntu
3. **Attendi** che Ubuntu la monti automaticamente

---

### Passo 4: Identifica il Punto di Montaggio

Ubuntu dovrebbe montare automaticamente la SD in `/media/$USER/`.

Verifica con:

```bash
# Elenca i dispositivi montati
lsblk

# Output esempio:
# NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
# sdb           8:16   1  29.7G  0 disk
# ├─sdb1        8:17   1   256M  0 part /media/tuo-user/boot
# └─sdb2        8:18   1  29.5G  0 part /media/tuo-user/rootfs

# Cerca le partizioni della SD
ls -la /media/$USER/

# Output esempio:
# drwxr-xr-x  2 root root  4096 nov 19 10:00 boot
# drwxr-xr-x 22 root root  4096 nov 19 10:00 rootfs
```

**Quello che ci serve è la partizione `rootfs`** (o `root` o simili).

Se non è montata automaticamente:

```bash
# Crea punto di montaggio
sudo mkdir -p /mnt/sd-rootfs

# Monta la partizione (sostituisci sdX2 con il tuo device)
sudo mount /dev/sdb2 /mnt/sd-rootfs

# Verifica montaggio
ls /mnt/sd-rootfs/opt
# Dovresti vedere le directory del sistema Raspberry Pi
```

---

### Passo 5: Esegui lo Script di Aggiornamento

```bash
# Vai nella directory device
cd ~/farmadisplay/device

# Esegui lo script (con sudo!)
# Se la SD è montata automaticamente:
sudo ./update_sd_card.sh /media/$USER/rootfs

# Se l'hai montata manualmente:
sudo ./update_sd_card.sh /mnt/sd-rootfs
```

**Output atteso:**

```
==================================================
TurnoTec SD Card Update Script
WiFi PSK Fix Installation (via SD Card)
==================================================

[1/7] Detecting SD card mount point...
✓ SD card found at: /media/tuo-user/rootfs

[2/7] Verifying TurnoTec installation...
✓ TurnoTec installation found

[3/7] Checking update files...
✓ Update files are ready

[4/7] Backing up existing scripts...
Backed up: configure_device.sh
✓ Backup created at: scripts.backup.1700000000

[5/7] Installing updated scripts...
Installing: generate_psk.py
✓ generate_psk.py installed
Installing: configure_device.sh
✓ configure_device.sh updated

[6/7] Verifying installation...
✓ generate_psk.py exists
✓ configure_device.sh exists
✓ configure_device.sh contains WiFi PSK fix
✓ generate_psk.py has correct Python shebang

[7/7] Installation summary...

Files installed:
  • /media/tuo-user/rootfs/opt/turnotec/scripts/generate_psk.py
  • /media/tuo-user/rootfs/opt/turnotec/scripts/configure_device.sh

Backup location:
  • /opt/turnotec/scripts.backup.1700000000/

Scripts directory contents:
-rwxr-xr-x 1 root root 3456 nov 19 10:30 configure_device.sh
-rwxr-xr-x 1 root root 2048 nov 19 10:30 generate_psk.py
...

==================================================
✓ Update completed successfully!
==================================================

NEXT STEPS:
...
```

---

### Passo 6: Smonta la MicroSD in Modo Sicuro

**IMPORTANTE:** Non rimuovere la SD senza smontarla prima!

```bash
# Smonta la partizione
sudo umount /media/$USER/rootfs

# Oppure se l'hai montata manualmente:
sudo umount /mnt/sd-rootfs

# Verifica che sia smontata
lsblk
# La colonna MOUNTPOINT per sdb2 dovrebbe essere vuota
```

Ora puoi **rimuovere fisicamente** la microSD dal PC.

---

### Passo 7: Reinserisci la MicroSD nel Raspberry Pi

1. **Inserisci** la microSD nel Raspberry Pi
2. **Collega** l'alimentazione
3. **Attendi** 1-2 minuti per il boot completo

---

### Passo 8: Connettiti all'Hotspot TurnoTec

Sul tuo smartphone o PC:

1. **Apri** le impostazioni WiFi
2. **Cerca** la rete: `TurnoTec`
3. **Connettiti** con password: `Bacheca2025`

---

### Passo 9: Configura il WiFi

1. **Apri browser** e vai a: `http://192.168.4.1:8080/`

2. **Compila il form:**
   - **Display ID:** `281224`
   - **WiFi SSID:** `Uaifai`
   - **WiFi Password:** `#QuestaQui23!` ← Ora funzionerà!
   - **Domain:** `turnotec.com`

3. **Clicca** "Invia configurazione"

4. **Attendi** che il sistema:
   - Salvi la configurazione
   - Fermi l'hotspot
   - Si riavvii (circa 30 secondi)

---

### Passo 10: Verifica la Connessione

Dopo il riavvio:

1. **Il Raspberry dovrebbe connettersi** alla rete WiFi `Uaifai`

2. **L'hotspot TurnoTec dovrebbe scomparire** (se continua a essere visibile, c'è un problema)

3. **Il display dovrebbe provare a caricare** l'URL:
   `https://turnotec.com/display/281224`

**Note:**
- Se vedi ancora splash screen: è normale se il server risponde 404
- Se l'hotspot riappare dopo 5 minuti: la connessione WiFi è fallita

---

## 🔍 Verifica che il Fix sia Stato Applicato

Se vuoi verificare che l'aggiornamento sia andato a buon fine:

### Opzione A: Controlla i Log

Se hai modo di accedere ai log del Raspberry (es. collegando schermo HDMI):

1. Dopo aver configurato il WiFi, cerca nei log:

```bash
sudo cat /var/log/turnotec-configure.log
```

Dovresti vedere:
```
[2024-11-19 XX:XX:XX] Configuring WiFi...
[2024-11-19 XX:XX:XX] Generating secure PSK hash for WiFi password...  ← NUOVO!
[2024-11-19 XX:XX:XX] PSK hash generated successfully                  ← NUOVO!
[2024-11-19 XX:XX:XX] WiFi configuration saved with secure PSK hash    ← NUOVO!
```

### Opzione B: Controlla i File sulla SD

Prima di reinserire la SD nel Raspberry, verifica:

```bash
# Con la SD ancora montata sul PC
cat /media/$USER/rootfs/opt/turnotec/scripts/generate_psk.py | head -5
# Dovresti vedere il codice Python

grep "Generating secure PSK hash" /media/$USER/rootfs/opt/turnotec/scripts/configure_device.sh
# Dovrebbe trovare la stringa
```

---

## 🐛 Risoluzione Problemi

### Problema 1: Script dice "SD card mount point not found"

**Soluzione:**

```bash
# 1. Trova il device della SD
lsblk

# 2. Monta manualmente la partizione rootfs
sudo mkdir -p /mnt/sd-rootfs
sudo mount /dev/sdb2 /mnt/sd-rootfs  # Sostituisci sdb2 con la tua partizione

# 3. Ri-esegui lo script
sudo ./update_sd_card.sh /mnt/sd-rootfs
```

---

### Problema 2: WiFi ancora non si connette dopo l'aggiornamento

**Possibili cause:**

1. **Password WiFi errata**
   - Verifica SSID (case-sensitive!)
   - Verifica password (carattere per carattere)

2. **Segnale WiFi debole**
   - Avvicina il Raspberry al router
   - Verifica che il WiFi sia attivo

3. **File wpa_supplicant.conf corrotto**
   - Rimonta la SD sul PC
   - Controlla: `/media/$USER/rootfs/etc/wpa_supplicant/wpa_supplicant.conf`
   - Dovrebbe contenere l'hash PSK (64 caratteri esadecimali)

4. **Test con password semplice**
   - Prova a configurare con password tipo `TestWifi123`
   - Se funziona → il fix c'è ma potrebbe esserci altro problema
   - Se non funziona → problema di connettività generale

---

### Problema 3: Hotspot riappare dopo 5 minuti

Questo significa che il Raspberry non è riuscito a connettersi al WiFi dopo 5 tentativi.

**Debug:**

1. **Rimonta la SD sul PC**

2. **Controlla il file di configurazione WiFi:**
   ```bash
   sudo cat /media/$USER/rootfs/etc/wpa_supplicant/wpa_supplicant.conf
   ```

   Dovrebbe essere così:
   ```
   ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
   update_config=1
   country=IT

   network={
       ssid="Uaifai"
       psk=be81854aaef330ca37006a51570d981e726ddb87eaaf0ccc67a04e3bf5668580
       key_mgmt=WPA-PSK
       priority=10
   }
   ```

3. **Verifica che la password sia hashata:**
   - ✅ `psk=64_caratteri_esadecimali` (corretto)
   - ❌ `psk="#QuestaQui23!"` (vecchia versione, male)

4. **Se vedi password in chiaro**, l'aggiornamento non è stato applicato:
   - Ripeti la procedura di aggiornamento
   - Verifica di essere sul branch corretto

---

### Problema 4: Display mostra solo splash screen

**Questo è NORMALE se:**
- Il server `turnotec.com/display/281224` risponde 404
- Questo è un problema server-side, non del Raspberry Pi

**Per verificare:**

1. Collega il Raspberry via Ethernet (se possibile)
2. O verifica che il WiFi sia connesso (LED attività)
3. Da un altro PC sulla stessa rete, verifica:
   ```bash
   curl -I https://turnotec.com/display/281224
   ```

Se risponde 404 → il problema è sul server web, non sul Raspberry.

**Soluzioni:**
- Configura il backend su turnotec.com per servire quella pagina
- Oppure usa un server di test diverso
- O crea una pagina HTML statica per test

---

### Problema 5: "Permission denied" durante aggiornamento

```bash
# Assicurati di usare sudo
sudo ./update_sd_card.sh /media/$USER/rootfs

# Se ancora problemi, controlla permessi:
ls -la device/update_sd_card.sh
# Dovrebbe essere -rwxr-xr-x

# Se non è eseguibile:
chmod +x device/update_sd_card.sh
```

---

## 📊 Checklist Finale

Prima di smontare la SD dal PC:

- [ ] Script eseguito senza errori
- [ ] Messaggio "✓ Update completed successfully!"
- [ ] File `generate_psk.py` presente in `/opt/turnotec/scripts/`
- [ ] File `configure_device.sh` aggiornato
- [ ] Backup creato in `scripts.backup.TIMESTAMP/`

Dopo aver riavviato il Raspberry:

- [ ] Hotspot TurnoTec visibile
- [ ] Form di configurazione accessibile su `http://192.168.4.1:8080/`
- [ ] Configurazione WiFi completata
- [ ] Raspberry si riavvia
- [ ] Hotspot TurnoTec scompare (buon segno!)
- [ ] WiFi connesso (se hotspot non riappare dopo 5+ minuti)

---

## 📞 Se hai ancora problemi

Raccogli queste informazioni:

1. **Output completo** dello script `update_sd_card.sh`

2. **Contenuto di wpa_supplicant.conf:**
   ```bash
   sudo cat /media/$USER/rootfs/etc/wpa_supplicant/wpa_supplicant.conf
   ```

3. **Contenuto di config.json:**
   ```bash
   sudo cat /media/$USER/rootfs/opt/turnotec/config.json
   ```

4. **Verifica che i file siano stati copiati:**
   ```bash
   ls -la /media/$USER/rootfs/opt/turnotec/scripts/ | grep -E '\.(py|sh)$'
   ```

E condividili per ulteriore supporto.

---

## ✅ Cosa Risolve Questo Fix

Dopo l'aggiornamento, il sistema:

✅ **Gestisce correttamente password WiFi con caratteri speciali** (`#`, `!`, `$`, `@`, `%`, ecc.)
✅ **Genera hash PSK sicuri** usando PBKDF2-HMAC-SHA1
✅ **Scrive hash nel wpa_supplicant.conf** invece della password in chiaro
✅ **Si connette affidabilmente** a reti WPA2-PSK
✅ **Non richiede modifiche manuali** alla configurazione

---

**Fine della guida. Buona fortuna! 🚀**
