# 📊 Analisi Server Requirements - 200 Display con Scraping ogni 2 Ore

**Scenario:** 200 display pubblici Raspberry Pi
**Frequenza Scraping:** Ogni 2 ore (120 minuti)
**Data:** 2025-11-15

---

## 🔢 Calcolo Carico Sistema

### Pattern di Utilizzo

**Assunzioni:**
- 200 display totali connessi
- 70% in modalità scraped (140 display)
- 30% in modalità image (60 display)
- Scraping ogni 2 ore per display scraped

### Carico Frontend (Display Request)

```
Display totali:              200 display
Frequenza refresh frontend:  15 minuti (come ottimizzato)
Requests per display:        4 req/ora (60 min / 15 min)

Total frontend requests:     200 × 4 = 800 req/ora
Frontend req/min:            13.3 req/min
Frontend req/sec:            0.22 req/sec
```

### Carico Scraping (Backend to farmaciediturno.org)

```
Display in modalità scraped: 140 display (70%)
Frequenza scraping:          Ogni 2 ore (120 minuti)
Scraping requests/display:   0.5 req/ora (1 req ogni 2 ore)

Total scraping requests:     140 × 0.5 = 70 req/ora
Scraping req/min:            1.17 req/min
Scraping req/sec:            0.019 req/sec

RIDUZIONE vs 15min:          -75% requests scraping!
RIDUZIONE vs 30sec:          -99.2% requests scraping!
```

### Carico Totale

```
Frontend requests:           800 req/ora (0.22 req/sec)
Scraping requests:           70 req/ora (0.019 req/sec)
Database queries:            ~2,400 query/ora (3 query per request)
Cache hits (Redis):          ~60% (se implementato)

TOTALE REQUESTS:             870 req/ora
TOTALE REQ/SEC:              ~0.24 req/sec
PEAK REQ/SEC:                ~0.5 req/sec (con spike)
```

---

## 💻 Requisiti Hardware Consigliati

### Configurazione Ottimale (200 Display, Scraping 2h)

```
CPU:        2-3 vCPU (Intel/AMD)
            - 1 vCPU: Frontend/API serving
            - 1 vCPU: Scraping worker + database
            - 1 vCPU: Sistema operativo + buffer

RAM:        6-8 GB
            - Backend FastAPI:     2.5 GB
            - PostgreSQL:          2 GB (con 200 connessioni)
            - Redis (opzionale):   512 MB
            - Nginx:               256 MB
            - Sistema (buffer):    1-2 GB

Storage:    60-80 GB SSD NVMe
            - Sistema operativo:   10 GB
            - Database:            15-20 GB
              * 200 farmacie × ~50 KB = 10 MB
              * Display configs:     5 MB
              * Logs scraped:        5-10 GB/anno
              * User sessions:       100 MB
            - Logs applicazione:   5 GB
            - Uploads (loghi):     10 GB (200 × 50 KB)
            - Backup locali:       15 GB
            - Buffer/crescita:     10-15 GB

Bandwidth:  150-200 GB/mese
            - Frontend uscita:     60 GB
              (200 display × 4 req/h × 100 KB × 730 h)
            - Scraping ingresso:   2.6 GB
              (70 req/h × 50 KB × 730 h)
            - API overhead:        10%
            - Uploads/downloads:   5 GB
            - Backup remoti:       10 GB
```

---

## 🌐 Provider Raccomandati

### Opzione 1: Hetzner Cloud (CONSIGLIATO)

**Server:** CPX21 o CX31

```
Hetzner CPX21 (Shared vCPU):
├─ CPU:        3 vCPU AMD
├─ RAM:        4 GB
├─ Storage:    80 GB SSD
├─ Bandwidth:  20 TB/mese (!!!)
├─ Prezzo:     €5.83/mese (~€70/anno)
└─ Note:       Ottimo per 200 display, bandwidth abbondante

Hetzner CX31 (Dedicated vCPU):
├─ CPU:        2 vCPU Intel
├─ RAM:        8 GB
├─ Storage:    80 GB SSD
├─ Bandwidth:  20 TB/mese
├─ Prezzo:     €8.99/mese (~€108/anno)
└─ Note:       Migliori performance CPU, più RAM
```

**Raccomandazione:** Hetzner CPX21 (€5.83/mese) è più che sufficiente!

### Opzione 2: Contabo VPS

```
Contabo VPS S:
├─ CPU:        6 vCPU
├─ RAM:        6 GB
├─ Storage:    100 GB SSD
├─ Bandwidth:  Unlimited (32 TB fair use)
├─ Prezzo:     €5.99/mese (~€72/anno)
└─ Note:       Ottimo rapporto qualità/prezzo

Contabo VPS M:
├─ CPU:        8 vCPU
├─ RAM:        12 GB
├─ Storage:    200 GB SSD
├─ Bandwidth:  Unlimited
├─ Prezzo:     €9.99/mese (~€120/anno)
└─ Note:       Overprovisioned per questo uso
```

### Opzione 3: OVHcloud

```
OVH VPS Starter:
├─ CPU:        2 vCPU
├─ RAM:        4 GB
├─ Storage:    40 GB SSD
├─ Bandwidth:  Unlimited (250 Mbps)
├─ Prezzo:     €6/mese (~€72/anno)
└─ Note:       Storage limitato, OK per 200 display

OVH VPS Value:
├─ CPU:        2 vCPU
├─ RAM:        8 GB
├─ Storage:    80 GB SSD
├─ Bandwidth:  Unlimited
├─ Prezzo:     €12/mese (~€144/anno)
└─ Note:       Più RAM, buono per crescita futura
```

### Opzione 4: DigitalOcean

```
Droplet Basic 4GB:
├─ CPU:        2 vCPU (Regular Intel)
├─ RAM:        4 GB
├─ Storage:    80 GB SSD
├─ Bandwidth:  4 TB/mese
├─ Prezzo:     $24/mese (~€22/mese = €264/anno)
└─ Note:       Più costoso, ma affidabile

Droplet Basic 8GB:
├─ CPU:        2 vCPU
├─ RAM:        8 GB
├─ Storage:    160 GB SSD
├─ Bandwidth:  5 TB/mese
├─ Prezzo:     $48/mese (~€44/mese = €528/anno)
└─ Note:       Troppo costoso per questo uso
```

---

## 📊 Confronto Costi vs Configurazioni

| Provider | Server | CPU | RAM | Storage | Bandwidth | Prezzo/Mese | Prezzo/Anno |
|----------|--------|-----|-----|---------|-----------|-------------|-------------|
| **Hetzner** | CPX21 | 3 vCPU | 4 GB | 80 GB | 20 TB | **€5.83** | **€70** ⭐ |
| **Hetzner** | CX31 | 2 vCPU | 8 GB | 80 GB | 20 TB | €8.99 | €108 |
| **Contabo** | VPS S | 6 vCPU | 6 GB | 100 GB | Unlimited | **€5.99** | **€72** ⭐ |
| **Contabo** | VPS M | 8 vCPU | 12 GB | 200 GB | Unlimited | €9.99 | €120 |
| **OVH** | Starter | 2 vCPU | 4 GB | 40 GB | Unlimited | €6 | €72 |
| **OVH** | Value | 2 vCPU | 8 GB | 80 GB | Unlimited | €12 | €144 |
| **DigitalOcean** | 4GB | 2 vCPU | 4 GB | 80 GB | 4 TB | €22 | €264 |

**Vincitore:** Hetzner CPX21 o Contabo VPS S (~€70/anno)

---

## ⚡ Utilizzo Risorse Stimato

### CPU Utilization (200 Display, Scraping 2h)

```
Backend FastAPI:
├─ Idle:                    5-10% (1 vCPU)
├─ Normal load:             15-20% (1 vCPU)
├─ Peak (scraping burst):   30-40% (1 vCPU)
└─ Scraping load:           2-5% (molto basso!)

PostgreSQL:
├─ Idle:                    3-5% (1 vCPU)
├─ Normal queries:          10-15% (1 vCPU)
└─ Peak:                    20-25% (1 vCPU)

Nginx:
├─ Reverse proxy:           2-5% (1 vCPU)
└─ Static files:            1-2% (1 vCPU)

Sistema operativo:          5-10% (1 vCPU)

TOTALE CPU MEDIO:           25-35% (su 2-3 vCPU)
TOTALE CPU PEAK:            50-60% (burst gestibili)
```

**Conclusione:** 2-3 vCPU sono ampiamente sufficienti!

### RAM Utilization

```
FastAPI workers (3):        2.5 GB
├─ 3 workers × 800 MB = 2.4 GB
├─ Connection pool:     100 MB

PostgreSQL:                 2 GB
├─ Shared buffers:      512 MB
├─ Work mem:            256 MB
├─ Connections (200):   800 MB
├─ Cache:               400 MB

Redis (cache opzionale):    512 MB
├─ Scraping cache:      300 MB
├─ Session cache:       200 MB

Nginx:                      256 MB

Sistema operativo:          800 MB
├─ Kernel:              300 MB
├─ System services:     500 MB

TOTALE RAM USATA:           ~6 GB
TOTALE RAM CONSIGLIATA:     6-8 GB (con buffer 25%)
```

**Conclusione:** 6-8 GB RAM sono ideali per 200 display!

### Storage Utilization (Annuale)

```
Database (PostgreSQL):      15-20 GB/anno
├─ Pharmacy data:       200 × 50 KB = 10 MB
├─ Display configs:     200 × 25 KB = 5 MB
├─ User accounts:       50 × 10 KB = 500 KB
├─ Scraping logs:       70 req/h × 730 h/mese × 12 mesi × 5 KB
│                       = 3.1 GB/anno
├─ Session data:        100 MB
└─ Indexes + overhead:  5 GB

Application logs:           5-8 GB/anno
├─ Nginx access:        2 GB/anno
├─ Nginx error:         500 MB/anno
├─ Backend logs:        2 GB/anno
├─ Scraping logs:       1 GB/anno
└─ System logs:         1 GB/anno

Uploads (pharmacy logos):   10-15 GB
├─ 200 farmacie × 50 KB = 10 MB (loghi)
├─ 100 farmacie × 100 KB = 10 MB (immagini turni)
└─ Storico/backup:      10 GB

Backup locali:              15-20 GB
├─ Database dump:       5 GB
├─ Config backup:       1 GB
└─ 7-day rotation:      ×3 = 15 GB

Sistema operativo:          10 GB

TOTALE STORAGE ANNO 1:      55-73 GB
CONSIGLIATO:                80-100 GB SSD
```

### Bandwidth Utilization (Mensile)

```
Frontend (Display → Server):
├─ 200 display × 4 req/h × 730 h/mese = 584,000 req/mese
├─ 584,000 × 100 KB (media response) = 58.4 GB/mese
└─ Download dati farmacie

Scraping (Server → farmaciediturno.org):
├─ 70 req/h × 730 h/mese = 51,100 req/mese
├─ 51,100 × 50 KB (media HTML) = 2.6 GB/mese
└─ Upload richieste POST (~10 KB each) = 500 MB/mese

API Uploads (Loghi, immagini):
├─ 20 upload/mese × 200 KB = 4 MB/mese
└─ Trascurabile

Backup remoti (opzionale):
├─ Database backup: 5 GB/mese
└─ Solo se backup remoto attivo

TOTALE BANDWIDTH:           ~65 GB/mese
CONSIGLIATO:                150-200 GB/mese (margine 2-3x)
PEAK MONTH:                 100 GB/mese (con backup)
```

---

## 🎯 Raccomandazione Finale

### Server Consigliato per 200 Display (Scraping 2h)

**Scelta Ottimale: Hetzner CPX21**

```
┌─────────────────────────────────────────────┐
│  Hetzner Cloud CPX21                        │
├─────────────────────────────────────────────┤
│  CPU:        3 vCPU AMD (Shared)            │
│  RAM:        4 GB                           │
│  Storage:    80 GB SSD NVMe                 │
│  Bandwidth:  20 TB/mese                     │
├─────────────────────────────────────────────┤
│  Costo:      €5.83/mese (€70/anno)          │
│  Location:   Germania (Falkenstein/Helsinki)│
│  Uptime SLA: 99.9%                          │
└─────────────────────────────────────────────┘

✅ Pro:
   - Bandwidth ENORME (20 TB >> 65 GB necessari)
   - SSD NVMe velocissimo
   - Rete eccellente (1 Gbps)
   - Snapshot gratuiti
   - Firewall incluso
   - Affidabilità Hetzner
   - Costo competitivo

⚠️ Con:
   - RAM 4 GB (limite per crescita oltre 250 display)
   - vCPU shared (non dedicata)

Upgrade Path: Se serve più RAM → CX31 (€8.99/mese, 8 GB RAM)
```

### Alternativa Budget: Contabo VPS S

```
┌─────────────────────────────────────────────┐
│  Contabo VPS S                              │
├─────────────────────────────────────────────┤
│  CPU:        6 vCPU                         │
│  RAM:        6 GB                           │
│  Storage:    100 GB SSD                     │
│  Bandwidth:  Unlimited (32 TB fair use)     │
├─────────────────────────────────────────────┤
│  Costo:      €5.99/mese (€72/anno)          │
│  Location:   Germania/USA                   │
└─────────────────────────────────────────────┘

✅ Pro:
   - Più vCPU (6 vs 3)
   - Più RAM (6 GB vs 4 GB)
   - Più storage (100 GB vs 80 GB)
   - Bandwidth unlimited
   - Margine crescita maggiore

⚠️ Con:
   - SSD non NVMe (più lento)
   - Support meno reattivo
   - Rete non veloce come Hetzner
```

---

## 📈 Confronto con Altri Scenari

| Scenario | Display | Scraping | Req/h | vCPU | RAM | Storage | Cost/Mese | Cost/Anno |
|----------|---------|----------|-------|------|-----|---------|-----------|-----------|
| **Baseline** | 100 | 30 sec | 8,400 | 4 | 8 GB | 50 GB | €9-12 | €108-144 |
| **Ottimizzato** | 100 | 15 min | 280 | 2-3 | 4-6 GB | 40-50 GB | €5-7 | €60-84 |
| **Questo** | 200 | 2 ore | 70 | 2-3 | 6-8 GB | 60-80 GB | **€6-9** | **€72-108** |
| Ipotetico | 200 | 15 min | 560 | 3-4 | 8-10 GB | 60-80 GB | €9-15 | €108-180 |

**Analisi:**
- Scraping ogni 2 ore riduce DRASTICAMENTE il carico server
- Con 200 display e scraping 2h, costi simili a 100 display con 15min!
- Bandwidth è il vero risparmio: 65 GB/mese vs 100+ GB/mese

---

## 💡 Vantaggi Scraping Ogni 2 Ore

### Risparmio Risorse

```
CPU:     -85% utilizzo scraping vs 15min
RAM:     -30% cache necessaria
Storage: -75% log scraping
Network: -75% bandwidth scraping
```

### Sostenibilità

```
✅ Carico minimo su farmaciediturno.org
✅ "Good citizen" del web
✅ Nessun rischio rate limiting
✅ Consumo energetico ridotto
✅ Carbon footprint minore
```

### Costi

```
Server:      €70/anno (Hetzner CPX21)
Backup:      €10/anno (opzionale)
Domain:      €12/anno
SSL:         Gratis (Let's Encrypt)

TOTALE:      ~€92/anno per 200 display!
             = €0.46/anno per display
             = €0.038/mese per display
```

---

## ⚠️ Considerazioni Display Farmacie

### Accettabilità Refresh 2 Ore

**✅ Perfetto per:**
- Farmacie rurali con turni stabili
- Zone con pochi cambiamenti orari
- Display informativi non critici
- Budget limitati

**⚠️ Da valutare per:**
- Farmacie urbane ad alta rotazione
- Zone con turni variabili
- Display critici (ospedali, pronto soccorso)

**❌ Non adatto per:**
- Emergenze in tempo reale
- Zone con cambio turni frequenti ogni ora

### Soluzione Ibrida Consigliata

Implementare refresh configurabile per display:

```typescript
// Esempio configurazione per display
interface DisplayConfig {
  refresh_interval: number; // in minuti
}

// Esempi:
Display rurale:     120 minuti (2 ore)
Display urbano:     30-60 minuti
Display critico:    15 minuti
Display notturno:   120-240 minuti
```

---

## 🚀 Piano Implementazione

### Fase 1: Deploy Configurazione Attuale (15min)
```
✅ Già implementato
✅ 100 display supportati
✅ Server €5-7/mese
```

### Fase 2: Aggiornamento per 200 Display (2h refresh)
```
1. Upgrade server: Hetzner CPX21 (€5.83/mese)
2. Modificare frontend: 900000ms → 7200000ms (2h)
3. Testare carico con 50 display
4. Scalare gradualmente a 200 display
5. Monitorare metriche per 1 settimana
```

### Fase 3: Ottimizzazione (opzionale)
```
1. Implementare Redis caching (TTL 2h)
2. Configurare refresh interval per display
3. Implementare monitoring (Grafana)
4. Setup backup automatici
```

---

## 📊 Metriche da Monitorare

### Performance Indicators

```
CPU Usage:              < 40% medio, < 70% peak
RAM Usage:              < 80% (lasciare buffer 20%)
Storage Usage:          < 70% (allarme a 80%)
Network Bandwidth:      < 100 GB/mese
Response Time API:      < 200ms (p95)
Scraping Success Rate:  > 98%
Database Connections:   < 150 simultanee
Uptime:                 > 99.5%
```

### Alerts da Configurare

```
🚨 Critici:
   - CPU > 80% per 10min
   - RAM > 90%
   - Disk > 85%
   - API response time > 1sec
   - Database down

⚠️ Warning:
   - CPU > 60% per 30min
   - RAM > 75%
   - Disk > 70%
   - Scraping errors > 5%
   - Bandwidth > 80 GB/mese
```

---

## 🔄 Upgrade Path

### Se Necessario Scalare Oltre 200 Display

**300-400 Display:**
```
Server:     Hetzner CX41 (4 vCPU, 16 GB RAM)
Costo:      €16/mese
Storage:    160 GB SSD
Bandwidth:  20 TB/mese
```

**500+ Display:**
```
Server:     Hetzner CX51 (8 vCPU, 32 GB RAM)
Costo:      €31/mese
+ Redis dedicato
+ Load balancer
+ Database replication
```

**1000+ Display:**
```
Architettura multi-server:
├─ Load Balancer:       Hetzner LB (€5/mese)
├─ App Server 1:        CX41 (€16/mese)
├─ App Server 2:        CX41 (€16/mese)
├─ Database Master:     CX41 (€16/mese)
├─ Database Replica:    CX31 (€9/mese)
└─ Redis Cache:         CX21 (€5/mese)

TOTALE: ~€67/mese per 1000+ display
```

---

## ✅ Conclusione

### Raccomandazione Finale per 200 Display (Scraping 2h)

```
┌──────────────────────────────────────────────────┐
│  SERVER CONSIGLIATO: Hetzner Cloud CPX21         │
├──────────────────────────────────────────────────┤
│  Specifiche:                                     │
│  • CPU: 3 vCPU AMD Shared                        │
│  • RAM: 4 GB                                     │
│  • Storage: 80 GB SSD NVMe                       │
│  • Bandwidth: 20 TB/mese                         │
│                                                  │
│  Costo: €5.83/mese (€70/anno)                    │
│                                                  │
│  Performance Attese:                             │
│  • CPU utilizzo: 25-35% medio, 50% peak          │
│  • RAM utilizzo: 60-75% (2.5-3 GB usati)         │
│  • Storage: 60-70 GB primo anno                  │
│  • Bandwidth: 65 GB/mese (~0.3% del limite)      │
│  • Response time: < 100ms                        │
│                                                  │
│  Capacità:                                       │
│  • 200 display attuali: ✅ Perfetto              │
│  • 250 display: ✅ OK (upgrade RAM a 8GB se CPU) │
│  • 300+ display: ⚠️ Upgrade a CX31 consigliato   │
└──────────────────────────────────────────────────┘

💰 COSTO TOTALE ANNUALE: ~€92
   └─ Server: €70
   └─ Domain: €12
   └─ Backup: €10 (opzionale)

📊 COSTO PER DISPLAY: €0.46/anno (€0.038/mese)

🌱 SOSTENIBILITÀ: ★★★★★
   - 99.2% meno requests vs baseline 30sec
   - Carico minimo su risorse esterne
   - Ottimo rapporto costi/benefici
```

**VERDICT:** Con scraping ogni 2 ore, puoi servire **200 display** con un server da **€70/anno** mantenendo ottime performance e affidabilità! 🎉

---

**Data Analisi:** 2025-11-15
**Versione:** 2.0
**Progetto:** TurnoTec Platform
