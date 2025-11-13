# TurnoTec - Sistema Bacheca Turni Farmacie

Sistema completo per gestire e visualizzare turni farmaceutici tramite bacheche elettroniche intelligenti basate su Raspberry Pi.

## 🎯 Caratteristiche Principali

- ✅ **Backend API** - FastAPI + PostgreSQL + PostGIS
- ✅ **Dashboard Web** - React + TypeScript + TailwindCSS
- ✅ **Display Pubblico** - Vanilla JS ultra-leggero (<10KB)
- ⏸️ ~~**Device IoT** - Raspberry Pi Zero 2 W con FullPageOS~~ (Temporaneamente disabilitato)
- ⏸️ ~~**Network Healing** - Auto-reconnect Ethernet/WiFi~~ (Temporaneamente disabilitato)
- ✅ **Sicurezza** - JWT auth, HTTPS, Rate limiting

## 📁 Struttura Progetto

- `/backend` - API FastAPI (Python 3.11+)
- `/frontend` - Dashboard React (TypeScript)
- `/display` - Pagina display pubblica (Vanilla JS)
- ~~`/device` - Script Raspberry Pi e configurazioni~~ (Temporaneamente disabilitato)
- `/deployment` - Script deployment e configurazione server
- `/docs` - Documentazione completa

## 🚀 Quick Start

### Backend
```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## 📚 Documentazione

- [Architettura Software](./docs/architecture/)
- [API Reference](./docs/api/)
- [Deployment Guide](./docs/deployment/)
- [User Manual](./docs/user-manual/)

## 🛠️ Stack Tecnologico

**Backend:**
- FastAPI 0.104+
- PostgreSQL 15 + PostGIS
- Redis 7
- SQLAlchemy 2.0
- Alembic
- Pytest

**Frontend:**
- React 18
- TypeScript
- Vite 5
- TailwindCSS 3
- shadcn/ui
- TanStack Query

**Infrastructure:**
- Hetzner VPS CX21 (€5.83/mese)
- Nginx
- Let's Encrypt SSL
- Cloudflare CDN

## 📊 Status Progetto

- [x] Setup Repository
- [ ] Backend API MVP
- [ ] Frontend Dashboard
- [ ] Display Page
- [ ] Device Setup
- [ ] Testing
- [ ] Deployment

## 📝 License

MIT License - vedi [LICENSE](./LICENSE)

## 👥 Team

Sviluppato da [Nome Team/Sviluppatore]

## 📞 Contatti

- Email: admin@turnotec.com
- Repository: https://github.com/destone28/turnotec
