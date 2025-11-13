# TurnoTec - Guida Preparazione SD Card dal PC

**Preparazione microSD con TurnoTec pre-installato - SENZA accendere il Raspberry Pi**

Questa guida spiega come preparare una microSD card con il sistema TurnoTec già installato, partendo da una installazione pulita di FullPageOS. La SD sarà pronta all'uso: basterà inserirla nel Raspberry Pi per avere il sistema funzionante con hotspot attivo.

---

## 📦 Cosa Ti Serve

### Hardware
- ✅ MicroSD card 8GB+ (Class 10 o superiore)
- ✅ Lettore SD card USB
- ✅ PC (Windows, Mac o Linux)

### Software
- ✅ [Raspberry Pi Imager v1.9.6+](https://www.raspberrypi.com/software/)
- ✅ Repository TurnoTec (questo progetto)

### Software Aggiuntivo per Sistema Operativo

| OS | Software Necessario | Link |
|---|---|---|
| **Linux** | Nessuno (tutto integrato) | - |
| **macOS** | Nessuno (tutto integrato) | - |
| **Windows 10/11** | WSL2 (Ubuntu) | [Guida WSL](https://learn.microsoft.com/it-it/windows/wsl/install) |
| **Windows (alt)** | DiskInternals Linux Reader | [Download](https://www.diskinternals.com/linux-reader/) |

---

## 🎯 Panoramica del Processo

```
┌─────────────────────────────────────────┐
│  1. Flash FullPageOS su microSD        │
│     (Raspberry Pi Imager)               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. Clona repository TurnoTec           │
│     (git clone)                         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. Esegui script preparazione SD       │
│     (prepare_sd.sh)                     │
│     - Monta partizioni SD               │
│     - Copia file TurnoTec               │
│     - Configura first-boot script       │
│     - Configura rc.local                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. Espelli SD                          │
│     SD pronta per Raspberry Pi!         │
└─────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Inserisci SD in Raspberry Pi           │
│  - Primo boot: installa automaticamente │
│  - Avvia hotspot "TurnoTec"            │
│  - Mostra istruzioni su display        │
└─────────────────────────────────────────┘
```

**Tempo stimato**: 15-20 minuti
**Tempo primo boot Raspberry**: 8-12 minuti (installazione automatica)

---

## 📝 Procedura Completa

### Step 1: Flash FullPageOS su MicroSD

1. **Apri Raspberry Pi Imager**

2. **Seleziona OS**:
   - Click **"Choose OS"**
   - Naviga: `Other specific-purpose OS` → `FullPageOS` → **`FullPageOS (Stable 2025-04-01)`**

3. **Seleziona Storage**:
   - Click **"Choose Storage"**
   - Seleziona la tua microSD card

4. **Configura Opzioni Avanzate**:
   - Click sull'**ingranaggio ⚙️** (in basso a destra)
   - **Set hostname**: `turnotec` (opzionale)
   - ✅ **Enable SSH**: Abilita
   - ✅ **Set username and password**:
     - Username: `pi`
     - Password: `<scegli-password-sicura>`
   - ❌ **Configure wireless LAN**: **NON configurare** (lo faremo dopo)
   - ✅ **Set locale settings**: Italia/Europe

5. **Flash**:
   - Click **"Write"**
   - Conferma e attendi il completamento (5-10 minuti)

6. **NON rimuovere ancora la SD!**

---

### Step 2: Clona Repository TurnoTec

Apri terminale/PowerShell e clona il repository:

**Linux/Mac**:
```bash
cd ~/Downloads
git clone https://github.com/destone28/farmadisplay.git
cd farmadisplay/device
```

**Windows (PowerShell)**:
```powershell
cd $env:USERPROFILE\Downloads
git clone https://github.com/destone28/farmadisplay.git
cd farmadisplay\device
```

---

### Step 3: Prepara SD Card con TurnoTec

Scegli la procedura in base al tuo sistema operativo:

#### 🐧 Linux

```bash
# Assicurati che la SD sia ancora inserita
# Lo script la rileverà automaticamente

# Naviga nella cartella device
cd ~/Downloads/farmadisplay/device

# Rendi eseguibile lo script
chmod +x prepare_sd.sh

# Esegui come root
sudo ./prepare_sd.sh

# Segui le istruzioni:
# 1. Inserisci il device della SD (es: sdb, mmcblk0)
# 2. Conferma con: yes
# 3. Attendi completamento (2-3 minuti)
```

**Trovare il device della SD**:
```bash
# Prima di eseguire lo script, identifica la SD:
lsblk
# Cerca la tua SD (guarda la dimensione)
# Esempi: /dev/sdb, /dev/sdc, /dev/mmcblk0
```

#### 🍎 macOS

```bash
# Naviga nella cartella device
cd ~/Downloads/farmadisplay/device

# Rendi eseguibile lo script
chmod +x prepare_sd.sh

# Esegui come root
sudo ./prepare_sd.sh

# Segui le istruzioni:
# 1. Inserisci il disk della SD (es: disk2, disk3)
# 2. Conferma con: yes
# 3. Attendi completamento (2-3 minuti)
```

**Trovare il disk della SD**:
```bash
# Prima di eseguire lo script:
diskutil list
# Cerca la tua SD (guarda la dimensione)
# Esempio: /dev/disk2
```

#### 🪟 Windows

**Metodo A: Con WSL2 (Raccomandato)**

1. **Installa WSL2** (se non installato):
   ```powershell
   # PowerShell come Amministratore
   wsl --install -d Ubuntu
   # Riavvia PC se richiesto
   ```

2. **Prepara SD**:
   ```powershell
   # PowerShell come Amministratore
   # Apri WSL
   wsl

   # Naviga al repository (sostituisci <USERNAME> con tuo nome utente Windows)
   cd /mnt/c/Users/<USERNAME>/Downloads/farmadisplay/device

   # Trova device SD
   lsblk
   # Cerca la tua SD (esempio: sdb, sdc)

   # Esegui script
   sudo bash prepare_sd.sh
   # Inserisci device (es: sdb)
   # Conferma: yes
   # Attendi completamento

   # Esci da WSL
   exit
   ```

**Metodo B: Manuale con DiskInternals**

Per utenti Windows che preferiscono un metodo visuale, vedi la guida completa:
👉 **[PREPARE_SD_WINDOWS.md](PREPARE_SD_WINDOWS.md)**

---

### Step 4: Espelli SD Card

**Linux**:
```bash
# Lo script smonta automaticamente
# Rimuovi la SD in sicurezza
```

**macOS**:
```bash
# Lo script smonta automaticamente
# Oppure manualmente:
diskutil eject /dev/diskX
```

**Windows**:
```powershell
# Espelli da "Rimozione sicura hardware"
# O da Esplora Risorse → Click destro → Espelli
```

---

## ✅ Verifica SD Preparata

La SD dovrebbe contenere:

**Partizione Boot** (visibile su tutti i PC):
- ✅ `ssh` (file vuoto)
- ✅ `fullpageos.txt` (configurazione)
- ✅ `chromium-flags.txt` (ottimizzazioni)

**Partizione Root** (visibile solo su Linux/Mac/WSL):
- ✅ `/opt/turnotec-installer/` (cartella con file)
- ✅ `/opt/turnotec-installer/first_boot_install.sh` (script primo boot)
- ✅ `/etc/rc.local` (modificato per auto-start)

---

## 🚀 Primo Boot Raspberry Pi

### Cosa Succede

1. **Inserisci SD** nel Raspberry Pi Zero 2 W
2. **Connetti HDMI** display
3. **Connetti alimentazione**
4. **Attendi 8-12 minuti** (primo boot + installazione automatica)

### Timeline Primo Boot

```
0:00 - Boot Raspberry Pi OS
0:30 - Sistema operativo caricato
1:00 - rc.local esegue first_boot_install.sh
1:10 - Installazione pacchetti (apt-get update + install)
5:00 - Copia file e configurazione systemd
6:00 - Setup hotspot e servizi
7:00 - Pulizia e finalizzazione
8:00 - Sistema pronto!
      → Hotspot "TurnoTec" attivo
      → Display mostra istruzioni
```

### Display Mostra

```
┌─────────────────────────────────────┐
│          🏥 TurnoTec                │
│  Sistema di Visualizzazione Turni   │
│                                     │
│     ⚙️ Configurazione Richiesta    │
│                                     │
│  📱 Istruzioni per la Configurazione│
│                                     │
│  1️⃣  Connetti smartphone a WiFi:   │
│      TurnoTec                       │
│                                     │
│  2️⃣  Apri browser e visita:        │
│      http://192.168.4.1             │
│                                     │
│  3️⃣  Compila form configurazione    │
│                                     │
│  4️⃣  Conferma e attendi riavvio     │
└─────────────────────────────────────┘
```

---

## 📱 Configurazione Display

### Da Smartphone

1. **Connetti WiFi**:
   - SSID: `TurnoTec`
   - Password: `Bacheca2025`

2. **Apri Browser**:
   - URL: `http://192.168.4.1`

3. **Compila Form**:
   - **Display ID**: `abc123` (esempio)
   - **WiFi SSID**: Nome tua rete WiFi (opzionale se Ethernet connesso)
   - **WiFi Password**: Password rete WiFi (opzionale se Ethernet connesso)

4. **Conferma**:
   - Click "Configura e Riavvia"
   - Conferma nella finestra modale
   - Attendi 10 secondi

5. **Riavvio Automatico**:
   - Raspberry si riavvia
   - Si connette a WiFi/Ethernet
   - Mostra bacheca: `https://turnotec.com/display/{ID}`

---

## 🔍 Troubleshooting

### Script prepare_sd.sh fallisce

**Errore: "SD not found"**
```bash
# Verifica che la SD sia inserita
lsblk  # Linux
diskutil list  # macOS

# Assicurati di eseguire come root
sudo ./prepare_sd.sh
```

**Errore: "Partitions not mounted"**
```bash
# Smonta e rimonta manualmente
# Linux:
sudo umount /dev/sdX1 /dev/sdX2
sudo mount /dev/sdX1 /mnt/boot
sudo mount /dev/sdX2 /mnt/root

# macOS:
diskutil unmountDisk /dev/diskX
# Attendi auto-mount
```

### Primo boot non esegue installazione

**Verifica via SSH** (dopo 5 minuti dal boot):
```bash
ssh pi@turnotec.local
# Password: quella impostata in Raspberry Pi Imager

# Verifica log
cat /var/log/turnotec-first-boot.log

# Verifica file presenti
ls -la /opt/turnotec-installer/

# Verifica rc.local
cat /etc/rc.local

# Esegui manualmente se necessario
sudo bash /opt/turnotec-installer/install.sh
```

### Display non mostra istruzioni

**Possibili cause**:
1. Installazione primo boot non completata
2. Chromium non configurato correttamente
3. File template HTML mancante

**Verifica via SSH**:
```bash
ssh pi@turnotec.local

# Controlla servizio FullPageOS
sudo systemctl status fullpageos

# Controlla URL configurato
cat /boot/fullpageos.txt | grep URL

# Dovrebbe essere:
# FULLPAGEOS_URL=file:///opt/turnotec/web/templates/instructions.html

# Riavvia Chromium
sudo systemctl restart fullpageos
```

### Hotspot non visibile

**Verifica via SSH**:
```bash
ssh pi@turnotec.local

# Controlla servizio hotspot
sudo systemctl status turnotec-hotspot

# Controlla log
sudo tail -f /var/log/turnotec-hotspot.log

# Riavvia manualmente hotspot
sudo /opt/turnotec/scripts/hotspot_manager.sh restart

# Verifica interfaccia WiFi
sudo iw dev wlan0 info
```

---

## 🎯 Deployment in Massa

Per preparare molte SD card identiche:

### Metodo 1: Clona Immagine Master

1. **Prepara UNA SD** con la procedura completa
2. **Testa funzionamento** su Raspberry Pi
3. **Crea immagine disco**:

**Linux**:
```bash
# Crea immagine
sudo dd if=/dev/sdX of=~/turnotec-master.img bs=4M status=progress

# Comprimi (opzionale)
gzip ~/turnotec-master.img

# Clona su altre SD
sudo dd if=~/turnotec-master.img of=/dev/sdY bs=4M status=progress
```

**macOS**:
```bash
# Crea immagine
sudo dd if=/dev/rdiskX of=~/turnotec-master.img bs=4m

# Clona
sudo dd if=~/turnotec-master.img of=/dev/rdiskY bs=4m
```

**Windows**:
- Usa [Win32DiskImager](https://sourceforge.net/projects/win32diskimager/)
- Read → Salva `.img`
- Write → Scrivi su altre SD

### Metodo 2: Script Batch

```bash
# Script per preparare N SD cards
#!/bin/bash
for i in {1..10}; do
    echo "Inserisci SD card $i e premi INVIO"
    read
    sudo ./prepare_sd.sh
    echo "SD $i completata!"
done
```

---

## 📊 Checklist Preparazione

Prima di considerare la SD pronta:

- [ ] FullPageOS flashato correttamente
- [ ] SSH abilitato (file `ssh` in boot)
- [ ] Script `prepare_sd.sh` eseguito senza errori
- [ ] File copiati in `/opt/turnotec-installer/`
- [ ] `rc.local` modificato con first-boot script
- [ ] `chromium-flags.txt` in `/boot/`
- [ ] `fullpageos.txt` in `/boot/`
- [ ] SD espulsa in sicurezza

**Test finale**:
- [ ] SD inserita in Raspberry Pi
- [ ] Primo boot completato (8-12 minuti)
- [ ] Display mostra istruzioni
- [ ] Hotspot "TurnoTec" visibile
- [ ] Form configurazione accessibile da `http://192.168.4.1`

---

## 💡 Suggerimenti e Best Practices

### Performance

- ✅ Usa SD card **UHS-I U3** o superiori
- ✅ Usa lettore SD **USB 3.0** per velocità maggiori
- ✅ Comprimi immagini master con `gzip` per risparmiare spazio

### Organizzazione

- 📁 Crea cartella templates con immagine master
- 📝 Tieni log delle SD preparate con seriali
- 🏷️ Etichetta le SD con numero progressivo

### Sicurezza

- 🔒 Usa password SSH forte
- 🔒 Cambia password hotspot se necessario (in `hotspot_manager.sh`)
- 🔒 Disabilita SSH in produzione se non necessario

### Debug

- 📋 Conserva sempre log primo boot: `/var/log/turnotec-first-boot.log`
- 📋 Verifica installazione con: `systemctl status turnotec-*`
- 📋 Test connettività: `ping turnotec.com`

---

## 📞 Supporto

**Problemi durante preparazione SD**:
- Verifica prerequisiti software
- Controlla permessi (sudo/Amministratore)
- Controlla log: `/var/log/turnotec-first-boot.log` (via SSH)

**Documentazione completa**:
- [README.md](README.md) - Guida generale
- [PREPARE_SD_WINDOWS.md](PREPARE_SD_WINDOWS.md) - Guida Windows dettagliata

**GitHub Issues**:
- https://github.com/destone28/farmadisplay/issues

---

## 🎉 Conclusione

Con questa procedura puoi preparare SD card pronte all'uso direttamente dal PC, senza dover accendere ogni Raspberry Pi per l'installazione. Ideale per deployment in massa di display TurnoTec!

**Tempo totale per SD pronta**: 15-20 minuti
**Tempo primo boot Raspberry**: 8-12 minuti (automatico)
**Tempo totale**: ~30 minuti dalla SD vergine al display funzionante! 🚀
