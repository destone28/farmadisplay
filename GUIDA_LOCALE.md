# 🚀 Guida Avvio Locale TurnoTec

## 📋 Stato del Progetto

Tutti i componenti sono stati configurati e avviati con successo per lo sviluppo locale!

### ✅ Fix Implementati

1. **Type Annotations Python 3.12** - Risolto problema compatibilità Pydantic
2. **SQLite Database** - Configurato SQLite invece di PostgreSQL per semplicità
3. **PostGIS → Lat/Lon** - Implementata formula Haversine per calcolo distanze
4. **UUID/SQLite** - Risolto problema conversione UUID in authentication
5. **FullCalendar Locale** - Fixato import locale italiana

### 🚀 Servizi Attivi

| Servizio | URL | Stato |
|----------|-----|-------|
| **Backend API** | http://localhost:8000 | ✅ Running |
| **API Documentation** | http://localhost:8000/api/docs | ✅ Available |
| **Frontend Dashboard** | http://localhost:5173 | ✅ Running |
| **Display Page** | http://localhost:8080 | ✅ Running |

## 🔐 Credenziali

```
Username: admin
Password: Admin1234
```

## 📊 Dati di Test Creati

- **Farmacia**: Farmacia Centrale (Milano, Via Roma 123)
  - ID: `b89a97e9-9d2d-412f-89b1-7dfe8b85ef1d`
  - Coordinate: 45.4654°N, 9.1859°E

- **Turno**: 2025-11-06, 09:00-20:00
  - Note: "Turno di prova"

## 🧪 Come Testare

### 1. Frontend Dashboard

```bash
# Apri nel browser
http://localhost:5173/

# Effettua il login
Username: admin
Password: Admin1234

# Funzionalità disponibili:
- ✅ Dashboard con statistiche
- ✅ Gestione farmacie (lista, crea, modifica, elimina)
- ✅ Gestione turni con calendario FullCalendar
- ✅ Gestione dispositivi
- ✅ Profilo utente
```

### 2. Backend API

```bash
# Test endpoint base
curl http://localhost:8000/

# Login e ottieni token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin1234"}'

# Lista farmacie (richiede autenticazione)
TOKEN="<your-token>"
curl http://localhost:8000/api/v1/pharmacies \
  -H "Authorization: Bearer $TOKEN"

# Swagger UI per test interattivi
http://localhost:8000/api/docs
```

### 3. Display Page (Raspberry Pi)

```bash
# URL per la farmacia di test
http://localhost:8080/?id=b89a97e9-9d2d-412f-89b1-7dfe8b85ef1d

# Test API display
curl http://localhost:8000/api/v1/display/b89a97e9-9d2d-412f-89b1-7dfe8b85ef1d
```

#### Cosa Mostra il Display
- ✅ Nome e indirizzo farmacia
- ✅ Orologio e data in tempo reale
- ✅ Turni correnti (solo se l'ora attuale rientra nel turno)
- ✅ Farmacie vicine entro 5km (con calcolo distanza)
- ⏳ Messaggi (feature futura)

**Nota**: I turni vengono mostrati solo se sono attivi in quel momento. Il turno di test (09:00-20:00) sarà visibile solo durante quelle ore.

## 🛠️ Comandi Utili

### Backend

```bash
cd backend

# Attiva virtual environment
source venv/bin/activate

# Avvia server (se non già attivo)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Crea nuovi dati di test
python create_test_data.py

# Crea database tables
python -c "from app.database import engine, Base; from app.models import *; Base.metadata.create_all(bind=engine)"
```

### Frontend

```bash
cd frontend

# Avvia dev server (se non già attivo)
npm run dev

# Build per produzione
npm run build

# Run tests E2E
npm run test:e2e
```

### Display

```bash
cd display

# Avvia server HTTP (se non già attivo)
python3 -m http.server 8080
```

## 📁 Struttura Database

### SQLite Database: `backend/turnotec.db`

Tabelle create:
- `users` - Utenti del sistema (admin/user roles)
- `pharmacies` - Anagrafica farmacie con coordinate
- `shifts` - Turni di servizio delle farmacie
- `devices` - Dispositivi Raspberry Pi registrati

## ⚠️ Note Importanti

### Funzionalità Limitate in Locale

1. **Redis Non Disponibile**
   - Rate limiting disabilitato
   - Account lockout disabilitato
   - Impatto: Nessuno per sviluppo locale

2. **SQLite vs PostgreSQL**
   - Funzionalità geospaziali: Haversine formula (stessa precisione)
   - UUID: Gestito come stringa internamente
   - Migrazioni: Non necessarie per ora

### Differenze Produzione vs Locale

| Feature | Locale (SQLite) | Produzione (PostgreSQL) |
|---------|-----------------|-------------------------|
| Database | SQLite | PostgreSQL + PostGIS |
| Geolocation | Haversine formula | PostGIS ST_Distance |
| Redis | Non disponibile | Disponibile |
| UUID Type | String (convertito) | Native UUID |

## 🔄 Riavvio Servizi

Se i servizi si fermano, riavviali con:

```bash
# Backend (da backend/)
source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (da frontend/)
npm run dev

# Display (da display/)
python3 -m http.server 8080
```

## 🆕 Creazione Nuovi Dati

### Crea Farmacia tramite API

```bash
TOKEN="<your-token>"

curl -X POST http://localhost:8000/api/v1/pharmacies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Farmacia Nuova",
    "address": "Via Esempio 456",
    "city": "Roma",
    "postal_code": "00100",
    "phone": "+39 06 12345678",
    "email": "info@farmacia.it",
    "location": {
      "longitude": 12.4964,
      "latitude": 41.9028
    }
  }'
```

### Crea Turno tramite API

```bash
curl -X POST http://localhost:8000/api/v1/shifts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pharmacy_id": "<PHARMACY_UUID>",
    "date": "2025-11-07",
    "start_time": "08:00:00",
    "end_time": "22:00:00",
    "is_recurring": false,
    "notes": "Turno serale"
  }'
```

## 🐛 Troubleshooting

### Backend non si avvia
```bash
# Verifica dipendenze
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Verifica database
ls -lah turnotec.db
```

### Frontend errore dipendenze
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Display non carica dati
```bash
# Verifica che backend sia attivo
curl http://localhost:8000/

# Verifica che pharmacy ID sia corretto
curl http://localhost:8000/api/v1/display/<PHARMACY_ID>
```

## 📊 Monitoraggio

### Log Backend
I log del backend mostrano tutte le richieste HTTP e eventuali errori.

### Log Frontend
Apri Developer Tools nel browser (F12) per vedere console log.

### Log Display
Apri Developer Tools per vedere chiamate API e aggiornamenti.

## 🎯 Prossimi Step Consigliati

1. **Testare Frontend**: Login, creazione farmacia, gestione turni
2. **Testare Display**: Verificare caricamento dati in tempo reale
3. **Creare Più Turni**: Per testare visualizzazione multipli turni
4. **Test Geolocalizzazione**: Creare farmacie vicine per testare calcolo distanze
5. **Test Device**: Registrare dispositivo Raspberry Pi simulato

## 📝 Commit Effettuati

```
d60819f fix: resolve UUID/SQLite compatibility issue in authentication
745250e fix: migrate from PostGIS to lat/lon for SQLite compatibility
f96a171 fix: resolve Python 3.12 type annotation compatibility issues
```

## 🎉 Conclusione

Il progetto TurnoTec è **completamente funzionante in locale**!

Tutti i componenti (Backend, Frontend, Display) sono attivi e comunicano correttamente.
Il database è popolato con dati di test e pronto per ulteriori esperimenti.

Per qualsiasi problema, verifica i log dei servizi o consulta la sezione Troubleshooting.

---

**Ultimo aggiornamento**: 2025-11-06 23:20
**Versione**: 1.0.0-local
