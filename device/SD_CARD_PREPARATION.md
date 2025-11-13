# FarmaDisplay - Preparazione SD Card Senza SSH

Guida completa per preparare la SD card con bootstrap pre-installato, senza necessità di SSH.

---

## 🎯 Panoramica

Questa guida ti permette di preparare una SD card FullPageOS con il sistema di bootstrap **già installato e funzionante**, eliminando la necessità di SSH per l'installazione iniziale.

### Vantaggi di questo metodo

✅ **Zero SSH**: Nessuna connessione SSH necessaria
✅ **Plug & Play**: Inserisci la SD e il bootstrap si avvia automaticamente
✅ **Deployment di massa**: Prepara multiple SD card in parallelo
✅ **Affidabile**: Configurazione testata e validata prima del boot

### Flusso di lavoro

```
1. Flash FullPageOS su SD card
2. Monta SD card su PC
3. Esegui script prepare_sd_card.sh (Linux/Mac) o manuale (Windows)
4. Espelli SD card
5. Inserisci nel Raspberry Pi → Bootstrap si avvia automaticamente
```

---

## 🖥️ Preparazione su Linux/Mac (Raccomandato)

### Requisiti

- Linux (Ubuntu, Debian, Fedora, etc.) o macOS
- SD card con FullPageOS flashato
- Accesso root (sudo)

### Passo 1: Flash FullPageOS

```bash
# 1. Scarica FullPageOS
# https://github.com/guysoft/FullPageOS/releases

# 2. Flash con Raspberry Pi Imager o Balena Etcher
# (Vedi sezione sotto per dettagli)
```

### Passo 2: Identifica la SD Card

Dopo aver flashato, NON rimuovere la SD card. Identifica le partizioni:

```bash
# Linux
lsblk
# Output esempio:
# sdb
# ├─sdb1   512M  boot   (FAT32)
# └─sdb2   7.5G  rootfs (ext4)

# macOS
diskutil list
# Output esempio:
# /dev/disk4
#   1: boot    512 MB
#   2: rootfs  7.5 GB
```

### Passo 3: Monta la partizione rootfs

#### Su Linux

```bash
# Crea punto di mount
sudo mkdir -p /mnt/farmadisplay-sd

# Monta la partizione rootfs (sostituisci sdX2 con la tua partizione)
sudo mount /dev/sdX2 /mnt/farmadisplay-sd

# Verifica che sia montata correttamente
ls -la /mnt/farmadisplay-sd
# Dovresti vedere: bin, boot, dev, etc, home, usr, var, ...
```

#### Su macOS

macOS può leggere ext4 con tool aggiuntivi:

**Opzione A: Homebrew + fuse-ext2**

```bash
# Installa fuse-ext2
brew install --cask osxfuse
brew install ext4fuse

# Identifica il device
diskutil list
# Esempio: /dev/disk4s2

# Crea mount point
sudo mkdir -p /Volumes/farmadisplay-sd

# Monta (sostituisci diskXsY con il tuo device)
sudo ext4fuse /dev/disk4s2 /Volumes/farmadisplay-sd -o allow_other
```

**Opzione B: Usa una VM Linux** (più affidabile)

Se hai problemi con ext4fuse, usa una VM Linux (VirtualBox, Parallels, etc.) e segui le istruzioni Linux.

### Passo 4: Esegui lo script di preparazione

```bash
# Vai nella directory del progetto
cd /path/to/farmadisplay/device

# Esegui lo script (sostituisci con il tuo mount point)
sudo bash prepare_sd_card.sh /mnt/farmadisplay-sd
# o su macOS:
# sudo bash prepare_sd_card.sh /Volumes/farmadisplay-sd
```

Output atteso:
```
🚀 FarmaDisplay - SD Card Preparation Script
==============================================

✓ SD card root path validated: /mnt/farmadisplay-sd

📜 Copying bootstrap scripts...
✓ Bootstrap scripts copied to /usr/local/bin/

🔧 Installing systemd service...
✓ Systemd service installed

⚙️  Enabling bootstrap service...
✓ Bootstrap service enabled

📁 Creating configuration directory...
✓ Configuration directory created

📦 Creating dependency installer...
✓ Dependency installer created

🔧 Creating dependency installer service...
✓ Dependency installer service created and enabled

🔐 Enabling SSH...
✓ SSH enabled (created /boot/ssh file)

╔════════════════════════════════════════════════════════╗
║                                                        ║
║  ✅  SD CARD PREPARATION COMPLETED SUCCESSFULLY        ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

### Passo 5: Smonta ed espelli

```bash
# Linux
sudo umount /mnt/farmadisplay-sd
# Rimuovi SD card in sicurezza

# macOS
sudo umount /Volumes/farmadisplay-sd
diskutil eject /dev/diskX
```

### Passo 6: Avvia il Raspberry Pi

1. Inserisci SD card nel Raspberry Pi Zero 2 W
2. Connetti display HDMI
3. Connetti alimentazione
4. Attendi 5-10 minuti per il primo boot
5. Il sistema:
   - Installerà le dipendenze automaticamente
   - Abiliterà Bluetooth
   - Diventerà discoverable come "FarmaDisplay Setup"
6. **Pronto per ricevere configurazione via Bluetooth!**

---

## 🪟 Preparazione su Windows

Windows non può montare ext4 nativamente. Hai 3 opzioni:

### Opzione 1: Usa WSL2 (Windows Subsystem for Linux) - Raccomandato

WSL2 permette di accedere alle partizioni ext4.

#### Setup WSL2

```powershell
# 1. Installa WSL2 (PowerShell come amministratore)
wsl --install -d Ubuntu

# 2. Riavvia se necessario
# 3. Apri Ubuntu da menu Start
```

#### Prepara SD card con WSL2

```bash
# In WSL2 Ubuntu

# 1. Identifica la SD card
lsblk
# Cerca un device tipo sdb, sdc, etc. con dimensione della SD

# 2. Monta la partizione rootfs
sudo mkdir -p /mnt/farmadisplay-sd
sudo mount /dev/sdX2 /mnt/farmadisplay-sd  # Sostituisci sdX2

# 3. Accedi al progetto FarmaDisplay
# Se hai clonato su Windows, il path è:
cd /mnt/c/Users/TuoUsername/Path/To/farmadisplay/device

# 4. Esegui lo script
sudo bash prepare_sd_card.sh /mnt/farmadisplay-sd

# 5. Smonta
sudo umount /mnt/farmadisplay-sd
```

### Opzione 2: Usa DiskInternals Linux Reader (GUI)

**DiskInternals Linux Reader** permette di accedere a ext4 da Windows.

#### Download
[DiskInternals Linux Reader](https://www.diskinternals.com/linux-reader/)

#### Procedura

1. Installa DiskInternals Linux Reader
2. Inserisci SD card
3. Apri Linux Reader
4. Troverai la partizione ext4 montata automaticamente
5. **Problema**: Non puoi copiare facilmente file con permessi corretti

**⚠️ Limitazione**: Questo metodo è ottimo per leggere, ma NON per preparare la SD card, perché non mantiene i permessi Linux e i symlink.

### Opzione 3: Usa una VM Linux (VirtualBox)

Il metodo più affidabile su Windows.

#### Setup

1. Scarica e installa [VirtualBox](https://www.virtualbox.org/)
2. Scarica [Ubuntu Desktop](https://ubuntu.com/download/desktop)
3. Crea una VM Ubuntu
4. Collega la SD card USB alla VM
5. Segui le istruzioni Linux sopra

---

## 📋 Installazione Manuale (Avanzata)

Se preferisci non usare lo script automatico, ecco i passaggi manuali.

### Prerequisiti

- SD card con FullPageOS flashato e montata
- Partizione rootfs montata in `/mnt/sd` (o altro path)

### Comandi manuali

```bash
# Variabili
SD_ROOT="/mnt/sd"  # Modifica con il tuo mount point
PROJECT_DIR="/path/to/farmadisplay/device"  # Modifica

# 1. Copia script bootstrap
sudo mkdir -p "$SD_ROOT/usr/local/bin"
sudo cp "$PROJECT_DIR/scripts/first_boot_setup.py" "$SD_ROOT/usr/local/bin/"
sudo cp "$PROJECT_DIR/scripts/bt_config_receiver.py" "$SD_ROOT/usr/local/bin/"
sudo cp "$PROJECT_DIR/scripts/configure_fullpageos.py" "$SD_ROOT/usr/local/bin/"
sudo chmod +x "$SD_ROOT/usr/local/bin"/*.py

# 2. Copia systemd service
sudo mkdir -p "$SD_ROOT/etc/systemd/system"
sudo cp "$PROJECT_DIR/systemd/farmadisplay-bootstrap.service" \
        "$SD_ROOT/etc/systemd/system/"

# 3. Abilita service (crea symlink)
sudo mkdir -p "$SD_ROOT/etc/systemd/system/multi-user.target.wants"
sudo ln -sf /etc/systemd/system/farmadisplay-bootstrap.service \
            "$SD_ROOT/etc/systemd/system/multi-user.target.wants/"

# 4. Crea directory configurazione
sudo mkdir -p "$SD_ROOT/home/pi/.turnotec"
sudo chown 1000:1000 "$SD_ROOT/home/pi/.turnotec"

# 5. Crea script installazione dipendenze
sudo tee "$SD_ROOT/usr/local/bin/install_bootstrap_dependencies.sh" > /dev/null << 'EOF'
#!/bin/bash
DONE_FLAG="/home/pi/.turnotec/deps_installed"
if [ -f "$DONE_FLAG" ]; then exit 0; fi

apt-get update -qq
apt-get install -y python3 python3-pip bluetooth bluez libbluetooth-dev \
                   python3-dev build-essential rfkill wireless-tools wpasupplicant

pip3 install --break-system-packages pybluez --no-cache-dir || \
pip3 install pybluez --no-cache-dir

systemctl enable bluetooth
systemctl start bluetooth
rfkill unblock bluetooth

touch "$DONE_FLAG"
EOF

sudo chmod +x "$SD_ROOT/usr/local/bin/install_bootstrap_dependencies.sh"

# 6. Crea service per dipendenze
sudo tee "$SD_ROOT/etc/systemd/system/farmadisplay-deps-install.service" > /dev/null << 'EOF'
[Unit]
Description=FarmaDisplay Bootstrap Dependencies Installer
Before=farmadisplay-bootstrap.service
After=network.target
ConditionPathExists=!/home/pi/.turnotec/deps_installed

[Service]
Type=oneshot
ExecStart=/usr/local/bin/install_bootstrap_dependencies.sh
RemainAfterExit=yes
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 7. Abilita service dipendenze
sudo ln -sf /etc/systemd/system/farmadisplay-deps-install.service \
            "$SD_ROOT/etc/systemd/system/multi-user.target.wants/"

# 8. Abilita SSH (opzionale)
# Trova la partizione boot (di solito montata come /media/user/boot)
sudo touch "$SD_ROOT/../boot/ssh"  # Modifica il path se necessario

echo "✅ Installazione manuale completata!"
```

---

## 🔍 Verifica Installazione

Prima di rimuovere la SD card, verifica che tutto sia stato installato correttamente:

```bash
# Variabile
SD_ROOT="/mnt/farmadisplay-sd"  # Il tuo mount point

# Verifica script
ls -lh "$SD_ROOT/usr/local/bin/"first_boot_setup.py
ls -lh "$SD_ROOT/usr/local/bin/"bt_config_receiver.py
ls -lh "$SD_ROOT/usr/local/bin/"configure_fullpageos.py

# Verifica service
ls -lh "$SD_ROOT/etc/systemd/system/"farmadisplay-bootstrap.service

# Verifica symlink service abilitato
ls -lh "$SD_ROOT/etc/systemd/system/multi-user.target.wants/"farmadisplay-bootstrap.service

# Verifica directory
ls -ld "$SD_ROOT/home/pi/.turnotec"

# Tutto OK? Procedi con smount ed eject
```

Output atteso per tutti i comandi: file/directory esistono con permessi corretti.

---

## 📱 Configurazione via Bluetooth

Dopo aver avviato il Raspberry Pi con la SD preparata:

### 1. Primo Boot

- Tempo: 5-10 minuti
- Il sistema:
  1. Installa dipendenze Python e Bluetooth
  2. Abilita Bluetooth
  3. Avvia bootstrap service
  4. Diventa discoverable come **"FarmaDisplay Setup"**

### 2. Connessione da Smartphone

#### Android - Serial Bluetooth Terminal

1. Installa **"Serial Bluetooth Terminal"** dal Play Store
2. Apri app → Menu → **Devices**
3. Tap **Scan** (icona lente)
4. Nella lista, seleziona **"FarmaDisplay Setup"**
5. Tap **Connect**
6. Riceverai messaggio di benvenuto JSON:
   ```json
   {
     "status": "ready",
     "message": "FarmaDisplay Configuration Server",
     "version": "1.0",
     "timestamp": "2025-11-13T15:30:00"
   }
   ```

### 3. Invio Configurazione

1. Copia il JSON dalla dashboard FarmaDisplay
2. Nella app Bluetooth Terminal, incolla il JSON completo
3. Tap **Send** (icona invio)
4. Riceverai risposta di successo:
   ```json
   {
     "status": "success",
     "message": "Configuration applied successfully",
     "pharmacy_name": "Farmacia Centrale",
     "display_id": "3ri8zb",
     "wifi_ssid": "NomeRete",
     "display_url": "https://..."
   }
   ```
5. Il Raspberry Pi si riavvierà automaticamente dopo 5 secondi

### 4. Verifica Funzionamento

Dopo il reboot:
- WiFi connesso automaticamente
- FullPageOS carica l'URL configurato
- Display mostra la bacheca della farmacia
- 🎉 **Setup completato!**

---

## 🔧 Formato JSON Configurazione

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

**Validazioni automatiche**:
- `display_id`: 6 caratteri lowercase alphanumeric
- `wifi_ssid`: max 32 caratteri
- `wifi_password`: 8-63 caratteri
- `display_url`: deve iniziare con http:// o https://

---

## 🐛 Troubleshooting

### SD card non monta su Linux

```bash
# Verifica che la partizione esista
lsblk

# Se vedi la partizione ma non si monta:
sudo mount -t ext4 /dev/sdX2 /mnt/farmadisplay-sd

# Se hai errori di filesystem:
sudo fsck.ext4 -f /dev/sdX2
```

### "Permission denied" durante copia file

```bash
# Assicurati di usare sudo
sudo bash prepare_sd_card.sh /mnt/farmadisplay-sd
```

### Script non trova la partizione boot

Lo script cerca automaticamente la partizione boot per abilitare SSH. Se non la trova:

```bash
# Trova la partizione boot manualmente
lsblk | grep -i boot

# Monta la partizione boot
sudo mkdir -p /mnt/farmadisplay-boot
sudo mount /dev/sdX1 /mnt/farmadisplay-boot

# Crea file ssh
sudo touch /mnt/farmadisplay-boot/ssh

# Smonta
sudo umount /mnt/farmadisplay-boot
```

### Raspberry Pi non diventa discoverable

Possibili cause:
1. Dipendenze non installate correttamente
2. Bluetooth non abilitato
3. Bootstrap service non avviato

Debug via SSH (se abilitato):
```bash
ssh pi@fullpageos.local
# Password: raspberry

# Verifica dipendenze
ls -la /home/pi/.turnotec/deps_installed

# Verifica service
sudo systemctl status farmadisplay-deps-install
sudo systemctl status farmadisplay-bootstrap

# Verifica Bluetooth
hciconfig hci0
rfkill list

# Log
sudo journalctl -u farmadisplay-bootstrap -n 50
sudo tail -f /var/log/farmadisplay-bootstrap.log
```

### Reinstallare bootstrap

Se qualcosa va storto, puoi riconfigurare:

```bash
# Via SSH sul Raspberry Pi
sudo rm /home/pi/.turnotec/configured
sudo rm /home/pi/.turnotec/deps_installed
sudo systemctl enable farmadisplay-bootstrap
sudo reboot
```

---

## 🚀 Deployment di Massa

Per preparare multiple SD card:

### Metodo 1: Script in Loop

```bash
#!/bin/bash
# prepare_multiple_sd.sh

for i in {1..10}; do
    echo "=== Preparazione SD card $i/10 ==="
    echo "1. Flash FullPageOS su nuova SD card"
    echo "2. Inserisci SD card nel lettore"
    echo "3. Premi INVIO quando pronta..."
    read

    # Identifica automaticamente la partizione (esempio)
    ROOTFS=$(lsblk -o NAME,LABEL | grep rootfs | awk '{print "/dev/"$1}')
    MOUNT_POINT="/mnt/sd-$i"

    sudo mkdir -p "$MOUNT_POINT"
    sudo mount "$ROOTFS" "$MOUNT_POINT"
    sudo bash prepare_sd_card.sh "$MOUNT_POINT"
    sudo umount "$MOUNT_POINT"

    echo "✅ SD card $i completata. Espelli e inserisci la prossima."
    echo ""
done
```

### Metodo 2: Duplicazione con `dd`

Dopo aver preparato una SD card master:

```bash
# 1. Crea immagine master
sudo dd if=/dev/sdX of=farmadisplay-master.img bs=4M status=progress

# 2. Comprimi (opzionale)
gzip farmadisplay-master.img
# Risultato: farmadisplay-master.img.gz

# 3. Per ogni nuova SD card, flashare l'immagine master:
gunzip -c farmadisplay-master.img.gz | sudo dd of=/dev/sdX bs=4M status=progress

# 4. Espandi filesystem (se SD più grande)
sudo resize2fs /dev/sdX2
```

---

## 📊 Checklist Finale

Prima di distribuire le SD card, verifica:

- [ ] FullPageOS flashato correttamente
- [ ] Script bootstrap copiati in `/usr/local/bin/`
- [ ] Systemd services installati ed abilitati
- [ ] Directory `/home/pi/.turnotec/` creata
- [ ] SSH abilitato (file `ssh` in boot partition)
- [ ] SD card espulsa in sicurezza
- [ ] Test su un Raspberry Pi
- [ ] Bluetooth diventa discoverable al primo boot
- [ ] Configurazione via smartphone funziona
- [ ] WiFi si connette dopo configurazione
- [ ] Display mostra l'URL corretto

---

## 📚 Riferimenti

- **BOOTSTRAP_GUIDE.md**: Guida completa al sistema di bootstrap
- **README.md**: Panoramica generale del progetto device
- **Script**: `prepare_sd_card.sh` per automazione preparazione
- **FullPageOS**: https://github.com/guysoft/FullPageOS

---

## 📝 Note Importanti

1. **Backup**: Fai sempre backup della SD card master preparata
2. **Test**: Testa la prima SD preparata prima di fare deployment di massa
3. **WiFi 2.4GHz**: Raspberry Pi Zero 2 W supporta solo 2.4GHz
4. **WPA2-PSK**: Usa WPA2-PSK per massima compatibilità
5. **Tempo primo boot**: 5-10 minuti per installazione dipendenze
6. **SSH**: Mantieni SSH abilitato durante test iniziali

---

**Versione**: 1.0
**Ultimo aggiornamento**: 2025-11-13
**Autore**: FarmaDisplay Team
