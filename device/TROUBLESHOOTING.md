# TurnoTec - Troubleshooting Guide

Guida rapida per risolvere i problemi più comuni durante il setup.

---

## 🔴 Problema: Schermo Mostra Solo Splash Screen FullPageOS

### Sintomi
- Display mostra splash screen con cursore del mouse
- Nessuna pagina instructions.html visibile
- Hotspot "TurnoTec" non esiste

### Cause Possibili
1. **First-boot installation non eseguita**
2. **Ethernet non connesso al primo boot**
3. **Systemd service non abilitato**

### Diagnosi

#### 1. Verifica via SSH

```bash
ssh pi@turnotec.local
# Password: quella impostata in Raspberry Pi Imager

# Controlla log first-boot
cat /var/log/turnotec-first-boot.log

# Se file non esiste, il servizio non è partito
```

#### 2. Controlla Servizio First-Boot

```bash
# Verifica se il servizio esiste
systemctl status turnotec-firstboot.service

# Se non esiste:
ls -la /etc/systemd/system/turnotec-firstboot.service

# Verifica symlink
ls -la /etc/systemd/system/multi-user.target.wants/turnotec-firstboot.service
```

#### 3. Controlla Installer

```bash
# Verifica che i file siano presenti
ls -la /opt/turnotec-installer/

# Dovrebbe contenere:
# - first_boot_install.sh
# - install.sh
# - setup/
# - config/
```

### Soluzioni

#### Soluzione A: Esegui Installazione Manualmente

```bash
ssh pi@turnotec.local

# Connetti Ethernet!

# Esegui installazione manuale
cd /opt/turnotec-installer
sudo bash ./install.sh

# Segui il processo, al termine riavvia
sudo reboot
```

#### Soluzione B: Re-flash SD

Se l'installazione manuale fallisce:

1. Re-flash FullPageOS da zero
2. Esegui `prepare_sd.sh` di nuovo
3. **ASSICURATI DI CONNETTERE ETHERNET** prima del primo boot

---

## 🔴 Problema: Nessuna Connessione Internet al Primo Boot

### Sintomi
- Log mostra: "ERROR: No internet connection!"
- Installazione non procede

### Soluzione

```bash
# 1. Spegni Raspberry Pi
# 2. Connetti cavo Ethernet
# 3. Verifica che router/switch sia acceso
# 4. Riaccendi Raspberry Pi
# 5. Attendi 8-12 minuti
```

### Verifica Connessione

```bash
ssh pi@turnotec.local

# Testa connettività
ping -c 3 8.8.8.8

# Verifica IP
ip addr show eth0

# Se non ha IP, riavvia networking
sudo systemctl restart networking
```

---

## 🔴 Problema: Hotspot Non Si Attiva

### Dopo Installazione Completata

```bash
ssh pi@turnotec.local

# Controlla servizio hotspot
sudo systemctl status turnotec-hotspot.service

# Controlla log
sudo tail -f /var/log/turnotec-hotspot.log

# Riavvia hotspot manualmente
sudo /opt/turnotec/scripts/hotspot_manager.sh restart

# Verifica interfaccia WiFi
sudo iw dev wlan0 info
```

### Se Hotspot Non Parte

```bash
# Controlla configurazione
cat /opt/turnotec/state.json

# Se "configured": true, hotspot non parte (comportamento corretto)

# Per forzare modalità setup, rimuovi configurazione
sudo rm /opt/turnotec/config.json
sudo reboot
```

---

## 🔴 Problema: fullpageos.txt Non Funziona

### Sintomi
- Display non mostra la pagina corretta
- Chromium mostra errore

### Diagnosi

```bash
ssh pi@turnotec.local

# Rileva boot path
if [ -d /boot/firmware ]; then
    BOOT_PATH="/boot/firmware"
else
    BOOT_PATH="/boot"
fi

# Verifica contenuto
cat $BOOT_PATH/fullpageos.txt

# Dovrebbe contenere SOLO:
# file:///opt/turnotec/web/templates/instructions.html
# (nessun prefisso FULLPAGEOS_URL=)
```

### Soluzione

```bash
# Correggi formato
echo "file:///opt/turnotec/web/templates/instructions.html" | sudo tee $BOOT_PATH/fullpageos.txt

# Riavvia Chromium (FullPageOS)
sudo systemctl restart fullpageos

# Oppure riavvia sistema
sudo reboot
```

---

## 🔴 Problema: Pagina instructions.html Non Esiste

### Diagnosi

```bash
# Verifica file esista
ls -la /opt/turnotec/web/templates/instructions.html

# Se non esiste, installazione non completata
```

### Soluzione

```bash
# Re-esegui installazione
cd /opt/turnotec-installer
sudo bash ./install.sh
```

---

## 🔍 Debug Completo - Checklist

### 1. Verifica Partizioni SD

```bash
# Su PC, dopo prepare_sd.sh
# Boot partition dovrebbe contenere:
- ssh (file vuoto)
- fullpageos.txt (con URL instructions.html)

# Root partition dovrebbe contenere:
- /opt/turnotec-installer/
- /etc/systemd/system/turnotec-firstboot.service
- /etc/systemd/system/multi-user.target.wants/turnotec-firstboot.service (symlink)
```

### 2. Verifica Primo Boot

```bash
# Via SSH dopo primo boot
ssh pi@turnotec.local

# 1. Log first-boot
cat /var/log/turnotec-first-boot.log

# 2. Stato installazione
cat /opt/turnotec/state.json

# 3. Servizi attivi
systemctl list-units | grep turnotec

# 4. Boot path
cat /opt/turnotec/state.json | jq -r '.boot_path'
```

### 3. Verifica FullPageOS

```bash
# Processo Chromium
ps aux | grep chromium

# URL caricato
# (controlla in /boot/firmware/fullpageos.txt o /boot/fullpageos.txt)

# Logs FullPageOS
journalctl -u fullpageos -n 50
```

---

## 📝 Procedura Corretta Step-by-Step

### 1. Preparazione PC

```bash
cd ~/farmadisplay/device
sudo ./prepare_sd.sh

# Seleziona device SD (es: sdb)
# Conferma: yes
# Attendi completamento
```

### 2. Primo Boot Raspberry Pi

```bash
# 1. Inserisci SD
# 2. CONNETTI ETHERNET (IMPORTANTE!)
# 3. Connetti HDMI
# 4. Connetti alimentazione
# 5. Attendi 8-12 minuti
```

### 3. Verifica Installazione

```bash
# Dopo 8-12 minuti, schermo dovrebbe mostrare:
# "Configurazione Richiesta" con istruzioni

# Se non funziona:
ssh pi@turnotec.local
cat /var/log/turnotec-first-boot.log
```

### 4. Configurazione Display

```bash
# 1. Connetti smartphone a "TurnoTec"
# 2. Visita http://192.168.4.1
# 3. Compila form
# 4. Conferma
# 5. Attendi riavvio
```

---

## 🆘 Ultimo Resort: Fresh Start

Se nulla funziona:

```bash
# 1. Re-flash FullPageOS con Raspberry Pi Imager
#    - Enable SSH
#    - Set username/password
#    - NON configurare WiFi

# 2. Re-esegui prepare_sd.sh
cd ~/farmadisplay/device
sudo ./prepare_sd.sh

# 3. Inserisci SD nel Raspberry Pi

# 4. CONNETTI ETHERNET

# 5. Boot e attendi 8-12 minuti

# 6. Se ancora non funziona, esegui installazione manuale:
ssh pi@turnotec.local
cd /opt/turnotec-installer
sudo bash ./install.sh
```

---

## 📞 Report Bug

Se il problema persiste, raccogli queste informazioni:

```bash
# Via SSH
ssh pi@turnotec.local

# Salva questi output:
cat /var/log/turnotec-first-boot.log > ~/debug.txt
systemctl status turnotec-firstboot.service >> ~/debug.txt
cat /opt/turnotec/state.json >> ~/debug.txt
ls -la /opt/turnotec-installer/ >> ~/debug.txt
cat /boot/firmware/fullpageos.txt >> ~/debug.txt
journalctl -u fullpageos -n 100 >> ~/debug.txt

# Invia debug.txt per supporto
```

---

## ✅ Checklist Successo

Quando tutto funziona correttamente:

- ✅ Display mostra "Configurazione Richiesta" con istruzioni
- ✅ Hotspot "TurnoTec" visibile da smartphone
- ✅ http://192.168.4.1 mostra form configurazione
- ✅ File `/var/log/turnotec-first-boot.log` mostra "Installation Complete!"
- ✅ Servizio `systemctl status turnotec-hotspot` è attivo
- ✅ Servizio `systemctl status turnotec-monitor` è attivo
