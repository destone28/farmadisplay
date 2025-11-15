# 📊 TurnoTec - Confronto Scenari di Scaling

**Analisi Comparativa:** Server requirements per diversi scenari di utilizzo
**Data:** 2025-11-15

---

## 🎯 Scenari Analizzati

| # | Display | Scraping Frequency | Scraping Req/h | Frontend Req/h | Total Req/h |
|---|---------|-------------------|----------------|----------------|-------------|
| **1** | 100 | 30 secondi | 8,400 | 400 | 8,800 |
| **2** | 100 | 15 minuti ⭐ | 280 | 400 | 680 |
| **3** | 100 | 30 minuti | 140 | 400 | 540 |
| **4** | 200 | 15 minuti | 560 | 800 | 1,360 |
| **5** | 200 | 2 ore ⭐⭐ | 70 | 800 | 870 |
| **6** | 500 | 2 ore | 175 | 2,000 | 2,175 |

⭐ = Implementato attualmente
⭐⭐ = Scenario richiesto

---

## 📋 Tabella Comparativa Dettagliata

### Requisiti Hardware

| Scenario | Display | Scraping | vCPU | RAM | Storage | Bandwidth | Provider | Costo/Mese | Costo/Anno |
|----------|---------|----------|------|-----|---------|-----------|----------|------------|------------|
| **1. Baseline** | 100 | 30s | 4 | 8 GB | 50 GB | 200 GB | Hetzner CX31 | €8.99 | €108 |
| **2. Ottimizzato ⭐** | 100 | 15min | 2-3 | 4-6 GB | 40-50 GB | 100 GB | Hetzner CPX21 | €5.83 | €70 |
| **3. Ultra-ottimizzato** | 100 | 30min | 2 | 4 GB | 40 GB | 80 GB | Hetzner CPX11 | €4.15 | €50 |
| **4. Scale 2x** | 200 | 15min | 3-4 | 8 GB | 60-80 GB | 150 GB | Hetzner CX31 | €8.99 | €108 |
| **5. Scale 2x Eco ⭐⭐** | 200 | 2h | 2-3 | 4-6 GB | 60-80 GB | 150 GB | Hetzner CPX21 | €5.83 | €70 |
| **6. Enterprise** | 500 | 2h | 4-6 | 16 GB | 100-160 GB | 300 GB | Hetzner CX41 | €15.99 | €192 |

---

## 💰 Analisi Costi per Display

### Costo Annuale per Display

| Scenario | Display | Costo/Anno | Costo per Display | Costo per Display/Mese |
|----------|---------|------------|-------------------|------------------------|
| **1. Baseline** | 100 | €108 | €1.08/anno | €0.090/mese |
| **2. Ottimizzato ⭐** | 100 | €70 | **€0.70/anno** | **€0.058/mese** |
| **3. Ultra-ottimizzato** | 100 | €50 | **€0.50/anno** | **€0.042/mese** |
| **4. Scale 2x** | 200 | €108 | €0.54/anno | €0.045/mese |
| **5. Scale 2x Eco ⭐⭐** | 200 | €70 | **€0.35/anno** | **€0.029/mese** |
| **6. Enterprise** | 500 | €192 | **€0.38/anno** | **€0.032/mese** |

**Conclusione:** Più display si gestiscono, minore è il costo unitario! 📉

---

## 🔋 Utilizzo Risorse Comparative

### CPU Utilization (%)

```
Scenario        │ Idle  │ Normal │ Peak  │ Scraping
────────────────┼───────┼────────┼───────┼──────────
1. Baseline     │ 10%   │ 35%    │ 70%   │ 25%
2. Ottimizzato  │ 5%    │ 20%    │ 45%   │ 8%
3. Ultra-opt    │ 5%    │ 18%    │ 40%   │ 4%
4. Scale 2x     │ 8%    │ 30%    │ 60%   │ 15%
5. Scale 2x Eco │ 5%    │ 25%    │ 50%   │ 2%  ⭐
6. Enterprise   │ 10%   │ 30%    │ 55%   │ 3%
```

### RAM Utilization

```
Scenario        │ Backend │ PostgreSQL │ Redis │ Sistema │ Totale │ Utilizzo %
────────────────┼─────────┼────────────┼───────┼─────────┼────────┼───────────
1. Baseline     │ 1.0 GB  │ 1.0 GB     │ 512MB │ 800 MB  │ 3.3 GB │ 41% (8GB)
2. Ottimizzato  │ 850 MB  │ 900 MB     │ 300MB │ 700 MB  │ 2.7 GB │ 68% (4GB)
3. Ultra-opt    │ 800 MB  │ 850 MB     │ 200MB │ 650 MB  │ 2.5 GB │ 63% (4GB)
4. Scale 2x     │ 1.5 GB  │ 1.5 GB     │ 512MB │ 900 MB  │ 4.4 GB │ 55% (8GB)
5. Scale 2x Eco │ 1.2 GB  │ 1.2 GB     │ 300MB │ 800 MB  │ 3.5 GB │ 73% (4GB) ⭐
6. Enterprise   │ 3.0 GB  │ 3.5 GB     │ 1 GB  │ 1.5 GB  │ 9.0 GB │ 56% (16GB)
```

### Storage Growth (Primo Anno)

```
Scenario        │ Database │ Logs │ Uploads │ Backup │ Totale │ Storage Allocato
────────────────┼──────────┼──────┼─────────┼────────┼────────┼─────────────────
1. Baseline     │ 10 GB    │ 8 GB │ 10 GB   │ 15 GB  │ 43 GB  │ 50 GB
2. Ottimizzato  │ 8 GB     │ 5 GB │ 10 GB   │ 12 GB  │ 35 GB  │ 40-50 GB
3. Ultra-opt    │ 8 GB     │ 3 GB │ 10 GB   │ 10 GB  │ 31 GB  │ 40 GB
4. Scale 2x     │ 15 GB    │ 10 GB│ 15 GB   │ 20 GB  │ 60 GB  │ 60-80 GB
5. Scale 2x Eco │ 15 GB    │ 5 GB │ 15 GB   │ 15 GB  │ 50 GB  │ 60-80 GB ⭐
6. Enterprise   │ 40 GB    │ 15 GB│ 30 GB   │ 40 GB  │ 125 GB │ 160 GB
```

### Bandwidth Mensile

```
Scenario        │ Frontend Out │ Scraping In │ Overhead │ Totale │ Allocated
────────────────┼──────────────┼─────────────┼──────────┼────────┼───────────
1. Baseline     │ 29 GB        │ 10 GB       │ 5 GB     │ 44 GB  │ 200 GB
2. Ottimizzato  │ 29 GB        │ 3 GB        │ 3 GB     │ 35 GB  │ 100 GB
3. Ultra-opt    │ 29 GB        │ 1.5 GB      │ 2 GB     │ 32 GB  │ 80 GB
4. Scale 2x     │ 58 GB        │ 6 GB        │ 6 GB     │ 70 GB  │ 150 GB
5. Scale 2x Eco │ 58 GB        │ 2.6 GB      │ 4 GB     │ 65 GB  │ 150 GB ⭐
6. Enterprise   │ 146 GB       │ 6.5 GB      │ 15 GB    │ 168 GB │ 300 GB
```

---

## 📊 Grafici Performance

### Request Rate Comparison

```
Requests/Ora
12,000 │
       │ ██
10,000 │ ██                     1. Baseline (8,800 req/h)
       │ ██
 8,000 │ ██
       │ ██
 6,000 │ ██
       │ ██    ██
 4,000 │ ██    ██               4. Scale 2x (1,360 req/h)
       │ ██    ██
 2,000 │ ██ ████ ██ ██ ██       2,3,5,6 (< 2,200 req/h)
       │ ██ ████ ██ ██ ██
     0 └────────────────────
         1  2,3  4  5  6
```

### Costo per Display (€/anno)

```
€/Display/Anno
1.20 │ ██
     │ ██                       1. Baseline (€1.08)
1.00 │ ██
     │ ██
0.80 │ ██ ██                    2. Ottimizzato (€0.70)
     │ ██ ██
0.60 │ ██ ██ ██
     │ ██ ██ ██ ██              4. Scale 2x (€0.54)
0.40 │ ██ ██ ██ ██ ██ ██
     │ ██ ██ ██ ██ ██ ██        5,6 (€0.35-0.38)
0.20 │ ██ ██ ██ ██ ██ ██
     │ ██ ██ ██ ██ ██ ██
   0 └────────────────────
       1  2  3  4  5  6
```

---

## 🎯 Raccomandazioni per Caso d'Uso

### Caso 1: Startup / PoC (10-50 Display)

**Scenario Consigliato:** Ultra-ottimizzato (30min refresh)

```
Server:         Hetzner CPX11 (2 vCPU, 2 GB, 40 GB)
Costo:          €4.15/mese (€50/anno)
Scraping:       Ogni 30 minuti
Displays:       Fino a 50 display
Caratteristiche: Costo minimo, ideale per test e validazione
```

### Caso 2: PMI / Catena Piccola (50-150 Display)

**Scenario Consigliato:** Ottimizzato ⭐ (15min refresh)

```
Server:         Hetzner CPX21 (3 vCPU, 4 GB, 80 GB)
Costo:          €5.83/mese (€70/anno)
Scraping:       Ogni 15 minuti
Displays:       100-150 display
Caratteristiche: Ottimo equilibrio costo/performance
                 Dati sufficientemente freschi
```

### Caso 3: Azienda Media (150-300 Display)

**Scenario Consigliato:** Scale 2x Eco ⭐⭐ (2h refresh)

```
Server:         Hetzner CPX21 (3 vCPU, 4 GB, 80 GB)
                o CX31 (2 vCPU, 8 GB, 80 GB) per più RAM
Costo:          €5.83-8.99/mese (€70-108/anno)
Scraping:       Ogni 2 ore
Displays:       200-250 display
Caratteristiche: Massima efficienza
                 Costo per display minimizzato
                 Sostenibile a lungo termine
```

### Caso 4: Enterprise (300-500 Display)

**Scenario Consigliato:** Enterprise (2h refresh)

```
Server:         Hetzner CX41 (4 vCPU, 16 GB, 160 GB)
Costo:          €15.99/mese (€192/anno)
Scraping:       Ogni 2 ore
Displays:       400-500 display
Caratteristiche: Alta affidabilità
                 Margine di crescita
                 Possibilità Redis caching
```

### Caso 5: Large Scale (500+ Display)

**Scenario Consigliato:** Multi-server Architecture

```
Load Balancer:  Hetzner LB (€5/mese)
App Server 1:   CX41 (€16/mese)
App Server 2:   CX41 (€16/mese)
DB Master:      CX41 (€16/mese)
DB Replica:     CX31 (€9/mese)
Redis Cache:    CX21 (€5/mese)

Costo Totale:   €67/mese (€804/anno)
Displays:       1000+ display
Costo/Display:  €0.80/anno
```

---

## 🔄 Migration Paths

### Da 100 a 200 Display

**Opzione A: Mantenere 15min refresh**
```
Prima:  CPX21 (3 vCPU, 4 GB) @ €5.83/mese
Dopo:   CX31  (2 vCPU, 8 GB) @ €8.99/mese
Delta:  +€3.16/mese (+€38/anno)
```

**Opzione B: Passare a 2h refresh ⭐ CONSIGLIATO**
```
Prima:  CPX21 (3 vCPU, 4 GB) @ €5.83/mese
Dopo:   CPX21 (3 vCPU, 4 GB) @ €5.83/mese (stesso server!)
Delta:  €0/mese (€0/anno)
Bonus:  -75% carico scraping
```

### Da 200 a 500 Display

**Opzione A: Single Server (2h refresh)**
```
Prima:  CPX21 (3 vCPU, 4 GB) @ €5.83/mese
Dopo:   CX41  (4 vCPU, 16 GB) @ €15.99/mese
Delta:  +€10.16/mese (+€122/anno)
```

**Opzione B: Cluster (High Availability)**
```
Prima:  CPX21 @ €5.83/mese
Dopo:   Multi-server @ €67/mese
Delta:  +€61/mese (+€732/anno)
Bonus:  99.99% uptime, auto-scaling
```

---

## 💡 Ottimizzazioni Avanzate

### 1. Refresh Interval Ibrido

Configurare intervalli diversi per tipologia display:

```typescript
const REFRESH_INTERVALS = {
  critical: 15 * 60 * 1000,    // 15 minuti - Ospedali, zone critiche
  urban: 60 * 60 * 1000,       // 1 ora - Città ad alta densità
  standard: 2 * 60 * 60 * 1000,// 2 ore - Farmacie standard
  rural: 4 * 60 * 60 * 1000,   // 4 ore - Zone rurali
  night: 6 * 60 * 60 * 1000    // 6 ore - Orario notturno (22:00-06:00)
};
```

**Benefici:**
- Ottimizzazione automatica per contesto
- Riduzione carico durante orari notturni
- Prioritizzazione display critici

### 2. Smart Caching con Redis

```python
# Cache scraping results per località
CACHE_CONFIG = {
    "ttl_high_traffic": 15 * 60,      # 15 min per città grandi
    "ttl_medium_traffic": 30 * 60,    # 30 min per città medie
    "ttl_low_traffic": 2 * 60 * 60,   # 2 ore per città piccole
}

# Esempio: 10 display richiedono Varese CAP 21100
# Con cache: 1 scraping ogni 15min invece di 10
# Risparmio: 90% requests duplicate
```

**Benefici:**
- -80-90% requests duplicate
- Response time istantaneo da cache
- Riduzione carico server esterno

### 3. Database Query Optimization

```sql
-- Index su campi frequenti
CREATE INDEX idx_display_config_pharmacy ON display_configs(pharmacy_id);
CREATE INDEX idx_pharmacy_location ON pharmacies USING GIST(location);

-- Materialize view per statistiche
CREATE MATERIALIZED VIEW display_stats AS
SELECT ...
REFRESH MATERIALIZED VIEW display_stats;  -- Ogni ora
```

**Benefici:**
- Query time: -70%
- Database CPU: -40%
- Supporto più display contemporanei

### 4. CDN per Static Assets

```nginx
# Configurare CloudFlare CDN (Gratuito)
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**Benefici:**
- -50% bandwidth server
- Response time migliore per display
- Protezione DDoS gratuita

---

## 📈 ROI Analysis

### Scenario: 200 Display per 3 Anni

**Opzione A: Baseline (30s refresh)**
```
Anno 1:  €108
Anno 2:  €108
Anno 3:  €108
TOTALE:  €324
```

**Opzione B: Ottimizzato (15min refresh)**
```
Anno 1:  €70
Anno 2:  €70
Anno 3:  €70
TOTALE:  €210
RISPARMIO: -€114 (-35%)
```

**Opzione C: Eco Mode (2h refresh) ⭐**
```
Anno 1:  €70
Anno 2:  €70
Anno 3:  €70
TOTALE:  €210
RISPARMIO: -€114 (-35%)
BONUS: -75% carico scraping, più sostenibile
```

### ROI per 500 Display (3 anni)

**Opzione Standard (15min):**
```
Server:  CX41 @ €192/anno
3 anni:  €576
```

**Opzione Eco (2h refresh):**
```
Server:  CX41 @ €192/anno
3 anni:  €576
BONUS:  -80% scraping load → Possibilità downgrade a CX31 (€108/anno)
3 anni:  €324
RISPARMIO: -€252 (-44%)
```

---

## ⚠️ Trade-offs da Considerare

### Scraping Frequency

| Intervallo | Pro | Contro | Ideale Per |
|------------|-----|--------|------------|
| **30 secondi** | ⚡ Dati in tempo reale | 💸 Costo alto, carico elevato | Emergenze, zone critiche |
| **15 minuti** | ⚖️ Buon equilibrio | 🔄 Ritardo accettabile | Uso generale, città |
| **2 ore** | 💰 Costo minimo | ⏰ Ritardo evidente | Zone rurali, turni stabili |

### Server Location

| Location | Latency Italia | Pro | Contro |
|----------|----------------|-----|--------|
| **Germania (Hetzner)** | ~20-30ms | Vicino, affidabile, economico | GDPR EU-only |
| **Italia (Aruba)** | ~5-10ms | Latenza minima | Più costoso |
| **USA (DigitalOcean)** | ~150-200ms | Tanti datacenter | Latenza alta, costoso |

---

## 🎯 Decisione Finale Consigliata

### Per 200 Display con Scraping 2 Ore

```
┌─────────────────────────────────────────────────────┐
│  CONFIGURAZIONE RACCOMANDATA                         │
├─────────────────────────────────────────────────────┤
│  Provider:   Hetzner Cloud                           │
│  Server:     CPX21                                   │
│  CPU:        3 vCPU AMD (Shared)                     │
│  RAM:        4 GB                                    │
│  Storage:    80 GB SSD NVMe                          │
│  Bandwidth:  20 TB/mese                              │
│  Location:   Falkenstein, Germany                    │
├─────────────────────────────────────────────────────┤
│  Scraping:   Ogni 2 ore                              │
│  Frontend:   Refresh ogni 15 minuti (già ottimizzato)│
│  Cache:      Redis (opzionale, consigliato)          │
│  Backup:     Automatico giornaliero                  │
├─────────────────────────────────────────────────────┤
│  COSTO MENSILE:  €5.83                               │
│  COSTO ANNUALE:  €70                                 │
│  COSTO/DISPLAY:  €0.35/anno (€0.029/mese)            │
├─────────────────────────────────────────────────────┤
│  PERFORMANCE:                                        │
│  • CPU utilizzo: 25-35% medio, 50% peak              │
│  • RAM utilizzo: 73% (3.5 GB su 4 GB)                │
│  • Requests: 870 req/h (0.24 req/sec)                │
│  • Response time: < 100ms                            │
│  • Uptime atteso: 99.9%                              │
├─────────────────────────────────────────────────────┤
│  CAPACITÀ:                                           │
│  • Display attuali: 200 ✅                           │
│  • Margine crescita: Fino a 250 display              │
│  • Upgrade path: CX31 per 300+ display               │
├─────────────────────────────────────────────────────┤
│  SOSTENIBILITÀ:                                      │
│  • Scraping load: MINIMO (70 req/h)                  │
│  • Good citizen: ★★★★★                               │
│  • Carbon footprint: BASSO                           │
│  • Scalabilità: ECCELLENTE                           │
└─────────────────────────────────────────────────────┘
```

**VERDICT:** Soluzione ottimale per costo, performance e sostenibilità! 🏆

---

**Data:** 2025-11-15
**Versione:** 2.0
**Progetto:** TurnoTec Platform
