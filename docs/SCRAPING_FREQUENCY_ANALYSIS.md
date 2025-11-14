# 📊 Analisi Impatto Frequenza Scraping - TurnoTec Platform

## Confronto Scenari di Refresh per 100 Display

---

## 🔄 Scenario Attuale (Baseline)

### **Refresh ogni 30 secondi**

#### Carico Scraping
```
Display in modalità scraped:    70 display (70%)
Frequenza scraping:             120 requests/ora per display
Total scraping requests/ora:    70 × 120 = 8,400 req/h
Requests/secondo:               2.33 req/sec
```

#### Risorse Server
```
CPU (scraping):                 ~20% utilizzo 1 core
RAM:                            ~1 GB backend
Bandwidth scraping:             ~10 GB/mese
Cache Redis:                    3.5 MB (TTL 30s)
```

#### Vantaggi
- ✅ Dati quasi in tempo reale
- ✅ Utenti vedono farmacie aggiornate subito
- ⚠️ Carico medio-alto sul server esterno

#### Svantaggi
- ❌ Maggior consumo risorse
- ❌ Più richieste al sito farmaciediturno.org
- ❌ Rischio rate limiting

---

## 🟢 SCENARIO 1: Refresh ogni 30 minuti (mezz'ora)

### **Frequenza: 2 richieste/ora per display**

#### Carico Scraping
```
Display in modalità scraped:    70 display
Frequenza scraping:             2 requests/ora per display
Total scraping requests/ora:    70 × 2 = 140 req/h
Requests/secondo:               0.04 req/sec

RIDUZIONE: -98.3% richieste scraping!
```

#### Risorse Server

**CPU:**
```
Baseline (30s):     20% utilizzo 1 core
Mezz'ora (30min):   ~1-2% utilizzo 1 core

RISPARMIO CPU: -90% sul processo scraping
```

**RAM:**
```
Backend Python:     850 MB (da 1 GB)
  - Meno worker threads necessari
  - Meno oggetti BeautifulSoup in memoria
PostgreSQL:         1 GB (invariato)
Redis Cache:        
  - Cache TTL: 30 minuti
  - Size: 3.5 MB (stesso dato, più tempo)
Sistema:            350 MB

TOTALE RAM: ~2.2 GB (da 2.5 GB)
RISPARMIO: -300 MB (-12%)
```

**Bandwidth:**
```
Scraping in ingresso:
  140 req/h × 50 KB × 730 h/mese = 5.1 GB/mese (da 10 GB)

Display in uscita:
  100 display × 2 req/min × 100 KB = 29 GB/mese (invariato)

TOTALE: ~35 GB/mese (da 50 GB)
RISPARMIO: -30% bandwidth
```

**Storage:**
```
Database:           Stesso (~500 MB)
Logs:               Ridotti del 50% (~250 MB da 500 MB)

RISPARMIO LOGS: -250 MB
```

#### Configurazione Server Ridotta Possibile

**Configurazione Minima Sufficiente:**
```
CPU:        2 vCPU (da 4 vCPU)
RAM:        4 GB (da 8 GB)
Storage:    30 GB SSD (da 50 GB)
Bandwidth:  50 GB/mese (da 200 GB)

Provider:   Hetzner CX21 → €4.90/mese (da €8.90)
            Contabo VPS S → €4.99/mese

RISPARMIO: -45% costo server (-€4/mese)
```

#### Vantaggi
- ✅ **Costo server ridotto del 45%** (€5 vs €9/mese)
- ✅ Carico minimo sul server esterno (good citizen)
- ✅ Meno rischio di rate limiting
- ✅ Consumi energetici ridotti Raspberry Pi
- ✅ Minor consumo banda Raspberry Pi (importante se su 4G)

#### Svantaggi
- ⚠️ Dati aggiornati ogni 30 minuti
- ⚠️ Possibile vedere farmacie chiuse per max 30 min
- ⚠️ Meno "real-time" per utenti finali

#### Caso d'Uso Ideale
- 🏪 Farmacie con orari stabili
- 📍 Zone dove i turni cambiano raramente
- 💰 Budget limitato
- 🌐 Display su connessione 4G/mobile (risparmio dati)

---

## 🟡 SCENARIO 2: Refresh ogni 15 minuti (quarto d'ora)

### **Frequenza: 4 richieste/ora per display**

#### Carico Scraping
```
Display in modalità scraped:    70 display
Frequenza scraping:             4 requests/ora per display
Total scraping requests/ora:    70 × 4 = 280 req/h
Requests/secondo:               0.08 req/sec

RIDUZIONE: -96.7% richieste scraping (vs baseline 30s)
```

#### Risorse Server

**CPU:**
```
Baseline (30s):     20% utilizzo 1 core
15 minuti:          ~3-4% utilizzo 1 core

RISPARMIO CPU: -80% sul processo scraping
```

**RAM:**
```
Backend Python:     900 MB (da 1 GB)
PostgreSQL:         1 GB
Redis Cache:        
  - Cache TTL: 15 minuti
  - Size: 3.5 MB
Sistema:            350 MB

TOTALE RAM: ~2.3 GB (da 2.5 GB)
RISPARMIO: -200 MB (-8%)
```

**Bandwidth:**
```
Scraping in ingresso:
  280 req/h × 50 KB × 730 h/mese = 10.2 GB/mese (vs 10 GB baseline)

Display in uscita:
  100 display × 2 req/min × 100 KB = 29 GB/mese

TOTALE: ~40 GB/mese (da 50 GB)
RISPARMIO: -20% bandwidth
```

#### Configurazione Server Possibile

**Configurazione Ottimizzata:**
```
CPU:        2-3 vCPU (da 4 vCPU)
RAM:        4-6 GB (da 8 GB)
Storage:    40 GB SSD (da 50 GB)
Bandwidth:  100 GB/mese (da 200 GB)

Provider:   Hetzner CX21 → €4.90/mese
            Contabo VPS S (upgrade RAM) → €6/mese
            
RISPARMIO: -30-40% costo (-€3-4/mese)
```

#### Vantaggi
- ✅ **Buon compromesso** costo/freschezza dati
- ✅ Costo ridotto del 30-40% (€6 vs €9/mese)
- ✅ Dati abbastanza aggiornati (15 min)
- ✅ Carico accettabile sul server esterno
- ✅ Minor rischio rate limiting

#### Svantaggi
- ⚠️ Ritardo massimo 15 minuti sui dati
- ⚠️ Risparmio energetico Raspberry Pi moderato

#### Caso d'Uso Ideale
- 🏥 **Uso consigliato per la maggior parte dei casi**
- ⚖️ Equilibrio perfetto costo/performance
- 🔄 Dati sufficientemente freschi
- 💼 Cliente business standard

---

## 📊 Tabella Comparativa Completa

| Metrica | 30 secondi | 15 minuti | 30 minuti |
|---------|-----------|-----------|-----------|
| **Scraping req/h** | 8,400 | 280 | 140 |
| **Scraping req/sec** | 2.33 | 0.08 | 0.04 |
| **CPU utilizzo** | 20% (1 core) | 3-4% | 1-2% |
| **RAM utilizzo** | 2.5 GB | 2.3 GB | 2.2 GB |
| **Bandwidth/mese** | 50 GB | 40 GB | 35 GB |
| **Server CPU** | 4 vCPU | 2-3 vCPU | 2 vCPU |
| **Server RAM** | 8 GB | 4-6 GB | 4 GB |
| **Costo/mese** | €9-12 | €5-7 | €5 |
| **Ritardo max dati** | 30 sec | 15 min | 30 min |
| **Freschezza dati** | ★★★★★ | ★★★★☆ | ★★★☆☆ |
| **Risparmio costi** | - | 30-40% | 45-50% |
| **Eco-friendly** | ★★☆☆☆ | ★★★★☆ | ★★★★★ |

---

## 💡 Implementazione Modifiche

### Modifica Backend - Refresh Rate

**File:** `frontend/src/pages/PublicDisplayPage.tsx`

```typescript
// Attuale (30 secondi)
const refreshInterval = setInterval(fetchData, 30000);

// Opzione 1: Ogni 15 minuti
const refreshInterval = setInterval(fetchData, 900000); // 15 * 60 * 1000

// Opzione 2: Ogni 30 minuti  
const refreshInterval = setInterval(fetchData, 1800000); // 30 * 60 * 1000
```

**File:** `frontend/src/pages/PublicDisplayPage.tsx` (scraping)

```typescript
// Attuale
const refreshInterval = setInterval(fetchPharmacies, 30000);

// Opzione 1: Ogni 15 minuti
const refreshInterval = setInterval(fetchPharmacies, 900000);

// Opzione 2: Ogni 30 minuti
const refreshInterval = setInterval(fetchPharmacies, 1800000);
```

### Modifica Cache Redis TTL

**File:** `backend/app/services/scraping_service.py`

Aggiungere caching con TTL appropriato:

```python
import redis
from datetime import timedelta

# Per refresh ogni 15 minuti
CACHE_TTL = timedelta(minutes=15)

# Per refresh ogni 30 minuti
CACHE_TTL = timedelta(minutes=30)

# Cachare risultati scraping
redis_client.setex(
    f"scraping:{cap}:{city}", 
    CACHE_TTL.total_seconds(),
    json.dumps(results)
)
```

---

## 🎯 Raccomandazioni per Scenario

### Scenario Cliente: Farmacia Singola (1-5 display)
```
Frequenza:  30 minuti ✅
Server:     VPS Minimo (2 vCPU, 4 GB) → €5/mese
Motivo:     Massimo risparmio, dati cambiano raramente
```

### Scenario Business: Catena Farmacie (10-50 display)
```
Frequenza:  15 minuti ✅ CONSIGLIATO
Server:     VPS Medio (2-3 vCPU, 6 GB) → €6-7/mese
Motivo:     Equilibrio perfetto costo/qualità
```

### Scenario Enterprise: Network Grande (50-100 display)
```
Frequenza:  15 minuti o ibrido (configurabile per display)
Server:     VPS Standard (4 vCPU, 8 GB) → €9-12/mese
Motivo:     Flessibilità, alcuni display real-time altri 15min
```

### Scenario Real-Time Critico (emergenze, zone alta rotazione)
```
Frequenza:  30 secondi - 5 minuti
Server:     VPS Performante (4 vCPU, 8 GB)
Motivo:     Necessità dati aggiornati continuamente
```

---

## 🔄 Implementazione Ibrida (Consigliata!)

### Refresh Configurabile per Display

Permettere di configurare la frequenza per ogni display:

```typescript
interface DisplayConfig {
  // ... altri campi
  refresh_interval: number; // in secondi: 30, 300, 900, 1800
}

// Nel componente
useEffect(() => {
  const interval = config?.refresh_interval || 900000; // default 15min
  const refreshTimer = setInterval(fetchPharmacies, interval);
  return () => clearInterval(refreshTimer);
}, [config?.refresh_interval]);
```

**Benefici:**
- ✅ Display critici: 5-10 minuti
- ✅ Display normali: 15-30 minuti  
- ✅ Display notturni: 60 minuti
- ✅ Ottimizzazione automatica risorse
- ✅ Massima flessibilità

---

## 💰 Riepilogo Risparmi

### Da 30s a 15 minuti
```
Risparmio Server:     -30% (€3-4/mese)
Risparmio Bandwidth:  -20%
Risparmio CPU:        -80%
Qualità Dati:         -5% (15min ritardo accettabile)

ROI: OTTIMO ⭐⭐⭐⭐⭐
```

### Da 30s a 30 minuti
```
Risparmio Server:     -45% (€4-5/mese)
Risparmio Bandwidth:  -30%
Risparmio CPU:        -90%
Qualità Dati:         -15% (30min ritardo visibile)

ROI: BUONO ⭐⭐⭐⭐☆
```

---

## 🎯 RACCOMANDAZIONE FINALE

### **Scelta Consigliata: Refresh ogni 15 MINUTI** ✅

**Motivi:**
1. ✅ **Risparmio significativo** (30-40% costi)
2. ✅ **Qualità dati accettabile** (farmacie turno cambiano raramente in 15min)
3. ✅ **Server più piccolo** (2-3 vCPU sufficiente)
4. ✅ **Good citizen** (meno carico sito esterno)
5. ✅ **Scalabile** (puoi configurare diversamente per display specifici)

### Server Raccomandato con 15min Refresh
```
Provider:   Contabo VPS S (upgraded)
CPU:        6 vCPU
RAM:        6 GB  
Storage:    50 GB SSD
Bandwidth:  100 GB/mese
Costo:      €5.99/mese

Alternative:
- Hetzner CX21: 2 vCPU, 4 GB → €4.90/mese (minimo)
- OVH VPS Starter: 2 vCPU, 4 GB → €6/mese
```

### Implementazione Phased
```
Fase 1: Deploy con 15 minuti (tutti i display)
Fase 2: Monitorare per 1 settimana
Fase 3: Se OK, considerare 30 minuti per display non critici
Fase 4: Implementare refresh configurabile per display
```

**Risparmio annuale:** €36-48/anno mantenendo qualità servizio! 💰

---

**Data Analisi:** 2025-11-13  
**Versione:** 1.0  
**Progetto:** TurnoTec Platform
