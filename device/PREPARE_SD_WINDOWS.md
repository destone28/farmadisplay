# TurnoTec - Preparazione SD Card da Windows

Guida completa per preparare una SD card con TurnoTec system da PC Windows.

## 📋 Software Necessario

### 1. Raspberry Pi Imager
- **Download**: https://www.raspberrypi.com/software/
- **Versione**: 1.9.6 o superiore
- **Uso**: Flash FullPageOS su SD card

### 2. Linux File Systems for Windows (LxRunOffline o WSL2)

**Opzione A: WSL2 (Windows 10/11 - Consigliato)**
```powershell
# Apri PowerShell come Amministratore
wsl --install -d Ubuntu

# Dopo riavvio, apri Ubuntu e aggiorna
sudo apt update
sudo apt install -y git
```

**Opzione B: DiskInternals Linux Reader (Più semplice)**
- **Download**: https://www.diskinternals.com/linux-reader/
- Software gratuito per leggere/scrivere partizioni ext4 da Windows

**Opzione C: Ext2Fsd (Avanzato)**
- **Download**: https://sourceforge.net/projects/ext2fsd/
- Driver per montare ext4 su Windows

## 🚀 Procedura Completa

### Metodo 1: Con WSL2 (Raccomandato)

#### Step 1: Flash FullPageOS

1. Apri **Raspberry Pi Imager**
2. Click **"Choose OS"**
3. Naviga: `Other specific-purpose OS` → `FullPageOS` → `FullPageOS (Stable 2025-04-01)`
4. Click **"Choose Storage"** → Seleziona SD card
5. Click **Ingranaggio ⚙️**:
   - ✅ Enable SSH
   - ✅ Username: `pi`
   - ✅ Password: `<tua-password>`
   - ❌ NON configurare WiFi
6. Click **"Write"**
7. Attendi completamento

#### Step 2: Clona Repository

```powershell
# Apri PowerShell
cd %USERPROFILE%\Downloads
git clone https://github.com/destone28/farmadisplay.git
```

#### Step 3: Prepara SD con WSL2

```powershell
# Apri PowerShell come Amministratore

# Trova la lettera della SD card (es: E:, F:, G:)
# Guarda in "Questo PC" - vedrà solo la partizione boot (FAT32)

# Apri WSL2
wsl

# Ora sei in Ubuntu WSL
cd /mnt/c/Users/<TUO-USERNAME>/Downloads/farmadisplay/device

# Trova il dispositivo SD (di solito /dev/sdX dove X è una lettera)
lsblk

# Esegui script preparazione (sostituisci sdX con tua lettera)
sudo bash prepare_sd.sh
# Quando richiesto, inserisci: sdX (es: sdb, sdc)
# Conferma con: yes

# Attendi completamento
# Quando finito, esci da WSL
exit
```

#### Step 4: Rimuovi SD in sicurezza

```powershell
# In PowerShell come Amministratore
# Espelli SD in sicurezza da "Rimozione sicura hardware"
```

---

### Metodo 2: Con DiskInternals Linux Reader (Più semplice ma manuale)

#### Step 1: Flash FullPageOS
(Stesso procedimento del Metodo 1, Step 1)

#### Step 2: Prepara i file

1. Scarica repository:
   ```powershell
   cd %USERPROFILE%\Downloads
   git clone https://github.com/destone28/farmadisplay.git
   cd farmadisplay\device
   ```

2. Crea file ZIP con i file necessari:
   - `setup/` (cartella completa)
   - `config/` (cartella completa)
   - `install.sh`

#### Step 3: Copia file su SD con DiskInternals

1. **Apri DiskInternals Linux Reader** come Amministratore

2. **Monta partizione rootfs della SD**
   - Nella lista dischi, trova la tua SD card
   - Vedrai 2 partizioni: `boot` (FAT32) e `rootfs` (ext4)
   - Click destro su `rootfs` → **Mount**

3. **Naviga e crea directory**
   - Naviga dentro la partizione montata
   - Crea directory: `/opt/turnotec-installer`
     - Click destro → New Folder
     - Nome: `turnotec-installer`

4. **Copia file preparati**
   - Click destro su `turnotec-installer` → **Save All**
   - Seleziona la cartella dove hai i file del repository
   - Copia: `setup/`, `config/`, `install.sh`

5. **Crea script first_boot_install.sh**
   - Dentro `/opt/turnotec-installer/`
   - Click destro → New File → `first_boot_install.sh`
   - Copia il contenuto da questo template:

```bash
#!/bin/bash
###############################################################################
# TurnoTec - First Boot Installation Script
###############################################################################

LOGFILE="/var/log/turnotec-first-boot.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOGFILE"
}

log "========================================="
log "TurnoTec First Boot Installation Started"
log "========================================="

sleep 10

cd /opt/turnotec-installer

log "Running installation script..."
bash ./install.sh --auto-confirm 2>&1 | tee -a "$LOGFILE"

if [ $? -eq 0 ]; then
    log "✓ Installation completed successfully"
    rm -rf /opt/turnotec-installer
    sed -i '/turnotec-installer\/first_boot_install.sh/d' /etc/rc.local
    log "========================================="
    log "TurnoTec Installation Complete!"
    log "========================================="
else
    log "ERROR: Installation failed!"
fi

exit 0
```

6. **Modifica rc.local**
   - Naviga a `/etc/rc.local`
   - Click destro → Save → Salva su PC
   - Modifica con Notepad++:

Prima dell'ultima riga `exit 0`, aggiungi:

```bash
# TurnoTec First Boot Installation
if [ -f /opt/turnotec-installer/first_boot_install.sh ]; then
    /opt/turnotec-installer/first_boot_install.sh &
fi
```

   - Salva il file
   - Carica nuovamente su SD (sostituisci il vecchio)

#### Step 4: Copia file su partizione boot

1. **Apri Esplora Risorse**
2. **Naviga alla SD card** (partizione boot, dovrebbe essere visibile)
3. **Copia questi file**:
   - Da `farmadisplay\device\config\` copia:
     - `chromium-flags.txt` → in root di SD
     - `fullpageos-template.txt` → in root di SD, rinomina in `fullpageos.txt`

4. **Crea file `ssh` vuoto**:
   - Click destro → Nuovo → Documento di testo
   - Nome: `ssh` (SENZA estensione .txt!)

#### Step 5: Rimuovi SD

- Espelli SD in sicurezza
- La SD è pronta!

---

### Metodo 3: Manuale Veloce (senza software extra)

Se non vuoi installare software aggiuntivi, puoi preparare la SD per eseguire l'installazione via SSH al primo boot:

#### Step 1: Flash FullPageOS
(Stesso del Metodo 1, Step 1 - con SSH abilitato)

#### Step 2: Primo boot e SSH

1. Inserisci SD nel Raspberry Pi
2. Connetti Ethernet e alimentazione
3. Attendi 3-5 minuti
4. Trova IP del Raspberry (da router o `ping turnotec.local`)
5. Connetti via SSH:
   ```powershell
   ssh pi@turnotec.local
   # Password: quella impostata
   ```

#### Step 3: Installa TurnoTec via SSH

```bash
# Sul Raspberry Pi via SSH
cd /tmp
git clone https://github.com/destone28/farmadisplay.git
cd farmadisplay/device
sudo chmod +x install.sh
sudo ./install.sh
# Conferma riavvio
```

---

## 🎯 Risultato Finale

Dopo aver preparato la SD con uno dei metodi, al primo boot il Raspberry Pi:

1. ✅ Esegue automaticamente l'installazione TurnoTec
2. ✅ Installa tutti i pacchetti necessari (5-8 minuti)
3. ✅ Configura systemd services
4. ✅ Avvia hotspot "TurnoTec"
5. ✅ Mostra pagina istruzioni sul display

**Tempo stimato primo boot**: 8-12 minuti

**Log installazione**: `/var/log/turnotec-first-boot.log` (accessibile via SSH)

---

## 📱 Configurazione Display

Dopo il primo boot:

1. **Display mostra**: Pagina con istruzioni configurazione
2. **Smartphone**: Connetti a WiFi `TurnoTec` (password: `Bacheca2025`)
3. **Browser**: Visita `http://192.168.4.1`
4. **Form**: Inserisci Display ID + WiFi (opzionale)
5. **Conferma**: Il dispositivo si riavvia e mostra la bacheca

---

## 🔍 Troubleshooting

### SD non riconosciuta da DiskInternals

**Soluzione**:
- Assicurati di aver flashato FullPageOS correttamente
- Prova a rimuovere e reinserire la SD
- Riavvia DiskInternals come Amministratore

### Partizione ext4 non visibile in WSL2

**Soluzione**:
```powershell
# Apri PowerShell come Amministratore
wsl --shutdown
wsl
# Riprova lsblk
```

### File rc.local non si salva

**Soluzione**:
- Salva il file sul Desktop Windows
- Modifica con Notepad++ (IMPORTANTE: Line endings UNIX - LF, non Windows CRLF)
  - In Notepad++: Edit → EOL Conversion → Unix (LF)
- Ricarica su SD

### Script non parte al primo boot

**Verifica via SSH**:
```bash
ssh pi@turnotec.local
cat /var/log/turnotec-first-boot.log
ls -la /opt/turnotec-installer/
cat /etc/rc.local
```

---

## 💡 Suggerimenti

### Per deployment in massa

1. Prepara UNA SD card master
2. Testa completamente
3. Crea immagine disco con Win32DiskImager:
   - **Download**: https://sourceforge.net/projects/win32diskimager/
   - Read → Salva immagine `.img`
4. Clona su altre SD:
   - Write → Seleziona `.img` salvata

### Velocizzare il processo

- Usa un **lettore SD USB 3.0** veloce
- Usa SD card **UHS-I U3** per velocità superiori
- Tieni template file pronti in una cartella

---

## 📞 Supporto

Se riscontri problemi:
- Controlla log: `/var/log/turnotec-first-boot.log`
- Esegui manualmente: `sudo bash /opt/turnotec-installer/install.sh`
- GitHub Issues: https://github.com/destone28/farmadisplay/issues
