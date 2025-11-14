# 📊 Analisi Requisiti Server - TurnoTec Platform
## Supporto fino a 100 Display Raspberry Pi

---

## 🔍 Analisi del Sistema

### Componenti dell'Architettura
1. **Backend FastAPI** (Python 3.11+)
2. **Frontend React** (build statico)
3. **PostgreSQL Database**
4. **Redis Cache**
5. **Scraping Service** (farmaciediturno.org)

### Pattern di Carico

#### 1. **Display Pubblici (Raspberry Pi)**
- **Quantità:** 100 display
- **Refresh Rate:** 30 secondi
- **Endpoint chiamato:** `/display/{display_id}`
- **Request/min per display:** 2
- **Request/min totali:** 200 req/min = **12,000 req/h**

#### 2. **Scraping Farmacie**
- **Frequenza:** Ogni 30 secondi per display in modalità "scraped"
- **Endpoint:** `/api/v1/scraping/search` (POST)
- **Stima 70% display in modalità scraped:** 70 display
- **Request scraping/min:** 140 req/min = **8,400 req/h**

#### 3. **Dashboard Admin**
- **Utenti concorrenti stimati:** 5-10 utenti
- **Request/min:** ~50 req/min = **3,000 req/h**

**TOTALE REQUEST/ORA: ~23,400 req/h (~6.5 req/sec)**

---

## 💾 Stima Risorse Database

### PostgreSQL
```sql
-- Dati principali
Farmacie:          100 record × 2KB    = 200 KB
Display Configs:   100 record × 5KB    = 500 KB
Users:             10 record × 1KB     = 10 KB
Scraped Data:      ~1000 farmacie × 2KB = 2 MB (cache temporanea)
Logs/Sessions:     Variabile          = ~100 MB/month

TOTALE DB: ~500 MB iniziali + crescita logs
```

### Redis Cache
```
Display Configs:   100 × 5KB    = 500 KB
Scraping Results:  70 × 50KB    = 3.5 MB (cache 30s)
Session Data:      10 users     = 100 KB

TOTALE REDIS: ~5-10 MB RAM
```

---

## 🖥️ Calcolo Risorse Server

### CPU
**Backend FastAPI:**
- Request leggere (GET display): ~2-5ms CPU
- Request scraping (parsing HTML): ~50-100ms CPU
- Throughput richiesto: 6.5 req/sec

**Calcolo:**
```
Media CPU/request: 20ms
6.5 req/sec × 20ms = 130ms CPU/sec = 13% utilizzo 1 core

Con picchi scraping:
140 scraping req/min × 80ms = 11.2sec CPU/min = ~20% utilizzo 1 core

TOTALE: 2 CPU cores sufficienti (con margine 70%)
```

### RAM
**Backend Python:**
```
Base FastAPI:           150 MB
SQLAlchemy + ORM:       100 MB
Worker processes (4):   150 MB × 4 = 600 MB
BeautifulSoup/lxml:     50 MB
Overhead/Cache:         100 MB

SUBTOTALE BACKEND: ~1 GB RAM
```

**PostgreSQL:**
```
Shared buffers:         256 MB
Work memory (4 conn):   64 MB
Cache:                  200 MB
Database size:          500 MB

SUBTOTALE POSTGRES: ~1 GB RAM
```

**Redis:**
```
Data:                   10 MB
Overhead:               40 MB

SUBTOTALE REDIS: ~50 MB RAM
```

**Frontend (Nginx):**
```
Static files:           50 MB
Nginx process:          20 MB

SUBTOTALE NGINX: ~70 MB RAM
```

**Sistema Operativo:**
```
Linux kernel:           150 MB
Sistema base:           200 MB

SUBTOTALE OS: ~350 MB RAM
```

**TOTALE RAM: ~2.5 GB utilizzati + 1 GB buffer = 4 GB raccomandati**

### Storage
```
Applicazione:           500 MB
Database:               2 GB (con spazio crescita)
Logs (3 mesi):          500 MB
Backup database:        2 GB
Upload immagini/PDF:    2 GB (20 MB × 100 display)
Sistema operativo:      5 GB

TOTALE STORAGE: 12 GB utilizzati
RACCOMANDATO: 30-50 GB SSD
```

### Network
```
Bandwidth in ingresso:
- 100 display × 2 req/min × 5 KB = 1 MB/min = 1.4 GB/month
- Scraping × 140 req/min × 50 KB = 7 MB/min = 10 GB/month
- Admin dashboard: 3 GB/month

Bandwidth in uscita:
- 100 display × 2 req/min × 100 KB (HTML+CSS+images) = 20 MB/min = 29 GB/month
- Admin API: 5 GB/month

TOTALE BANDWIDTH: ~50 GB/month
```

---

## 📋 SPECIFICHE SERVER RACCOMANDATE

### 🟢 Configurazione Minima (100 display)
```
CPU:        2 vCPU (2.4 GHz+)
RAM:        4 GB
Storage:    30 GB SSD
Bandwidth:  100 GB/month
OS:         Ubuntu Server 22.04 LTS

Provider:   Hetzner CX21 (~€5/mese)
            DigitalOcean Basic Droplet (~$12/mese)
            Contabo VPS S (~€5/mese)
```

### 🟡 Configurazione Raccomandata (100 display + margine)
```
CPU:        4 vCPU (2.4 GHz+)
RAM:        8 GB
Storage:    50 GB SSD
Bandwidth:  200 GB/month
OS:         Ubuntu Server 22.04 LTS

Provider:   Hetzner CX31 (~€9/mese)
            DigitalOcean Standard Droplet (~$24/mese)
            OVH VPS Value (~€10/mese)
```

### 🟢 Configurazione Ottimale (scalabilità futura)
```
CPU:        4-6 vCPU (3.0 GHz+)
RAM:        16 GB
Storage:    100 GB NVMe SSD
Bandwidth:  Illimitato/1TB
OS:         Ubuntu Server 22.04 LTS

Provider:   Hetzner CPX31 (~€15/mese)
            DigitalOcean Performance (~$48/mese)
            AWS Lightsail 4GB (~$24/mese)
```

---

## 🚀 Ottimizzazioni Implementate

### Backend
✅ **Caching Redis:** Display configs, risultati scraping
✅ **Connection Pooling:** PostgreSQL (max 20 connessioni)
✅ **Async I/O:** FastAPI + httpx per scraping
✅ **Gzip Compression:** Risposte API compresse
✅ **Static file serving:** Nginx (non Python)

### Frontend
✅ **Build ottimizzato:** Vite bundling
✅ **Code splitting:** Lazy loading routes
✅ **Gzip/Brotli:** Compressione statica
✅ **CDN ready:** Static assets cacheable

### Database
✅ **Indici ottimizzati:** display_id, user_id, pharmacy_id
✅ **Query efficienti:** SQLAlchemy ORM ottimizzato
✅ **Connection limit:** Evita esaurimento connessioni

---

## 📊 Scaling Scenarios

### Scenario 1: 200 Display (2x)
```
CPU:        4 vCPU
RAM:        8 GB
Storage:    60 GB SSD
Bandwidth:  150 GB/month
Costo:      €12-15/mese
```

### Scenario 2: 500 Display (5x)
```
CPU:        8 vCPU
RAM:        16 GB
Storage:    100 GB SSD
Bandwidth:  300 GB/month
Costo:      €25-35/mese

+ Load Balancer consigliato
+ Database dedicato separato
```

### Scenario 3: 1000+ Display (10x+)
```
Architettura Multi-Server:
- 2× Application Server (4 vCPU, 8 GB)
- 1× Database Server (8 vCPU, 16 GB)
- 1× Redis Server (2 vCPU, 4 GB)
- Load Balancer
Costo:      €80-120/mese
```

---

## 🔧 Stack Tecnologico Richiesto

### Software Stack
```bash
# Sistema Operativo
Ubuntu Server 22.04 LTS (64-bit)

# Runtime
Python 3.11+
Node.js 20+ (solo build, non in produzione)

# Database
PostgreSQL 15+
Redis 7+

# Web Server
Nginx 1.24+

# Process Manager
systemd / supervisor
gunicorn (workers: 4)

# Monitoring (opzionale)
Prometheus + Grafana
Sentry (error tracking)
```

---

## 💰 Stima Costi Mensili

### Hosting Server (100 display)
```
Server VPS:             €10/mese
Backup storage:         €2/mese
Domain + SSL:           €1/mese (Let's Encrypt gratuito)
Monitoring (opzionale): €5/mese

TOTALE: €13-18/mese
```

### Costi Scalabilità
```
200 display:    €15-20/mese
500 display:    €30-40/mese
1000 display:   €100-150/mese (architettura distribuita)
```

---

## ✅ Checklist Pre-Deploy

### Server Requirements
- [ ] Ubuntu Server 22.04 LTS
- [ ] Accesso SSH con chiave pubblica
- [ ] Firewall configurato (ufw)
- [ ] Utente non-root con sudo

### Software Installation
- [ ] Python 3.11+ con venv
- [ ] PostgreSQL 15+ configurato
- [ ] Redis 7+ configurato
- [ ] Nginx installato
- [ ] Certbot per SSL (Let's Encrypt)
- [ ] Git installato

### Security
- [ ] SSH solo chiave pubblica (no password)
- [ ] Firewall: solo porte 22, 80, 443
- [ ] PostgreSQL: no accesso esterno
- [ ] Redis: bind localhost only
- [ ] Fail2ban configurato
- [ ] Backup automatici attivi

### Monitoring
- [ ] Disk space monitoring
- [ ] CPU/RAM monitoring
- [ ] Application logs rotation
- [ ] Database backup schedule
- [ ] SSL certificate renewal automation

---

## 📈 Performance Attese

### Response Times (100 display)
```
GET /display/{id}:              < 50ms (cached)
POST /scraping/search:          200-500ms (scraping esterno)
Dashboard API calls:            < 100ms
Static files (frontend):        < 20ms (nginx)
```

### Uptime Target
```
SLA Target:                     99.5% uptime
Downtime mensile consentito:    3.6 ore/mese
Manutenzioni programmate:       2 ore/mese (notte)
```

### Capacity Planning
```
Request capacity:               50 req/sec (picco)
Database connections:           20 simultanee
Redis memory:                   Max 100 MB
Storage growth:                 ~500 MB/anno
```

---

## 🎯 RACCOMANDAZIONE FINALE

Per **100 display Raspberry Pi** il setup ottimale è:

### **VPS Cloud - Configurazione Raccomandata**
```
Provider:   Hetzner CX31 o OVH VPS Value
CPU:        4 vCPU
RAM:        8 GB
Storage:    50 GB NVMe SSD
Bandwidth:  200 GB/mese
OS:         Ubuntu 22.04 LTS
Costo:      €9-12/mese

Motivi:
✓ Margine del 70% su CPU/RAM per picchi
✓ Spazio sufficiente per crescita database
✓ Bandwidth abbondante per scraping
✓ Possibilità di upgrade senza migrazione
✓ Rapporto qualità/prezzo eccellente
```

### Alternative Budget
- **Contabo VPS M**: 6 vCPU, 16 GB RAM, 400 GB SSD → €7/mese (miglior rapporto qualità/prezzo)
- **Hetzner CX21**: 2 vCPU, 4 GB RAM, 40 GB SSD → €5/mese (configurazione minima)

---

**Data Analisi:** 2025-11-13  
**Versione:** 1.0  
**Basato su:** TurnoTec Platform (già FarmaDisplay)
