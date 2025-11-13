# TurnoTec Backend

FastAPI backend per la gestione turni farmacie e API per bacheche elettroniche.

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 15+ with PostGIS extension
- Redis 7+

### Installation

1. Create virtual environment:
```bash
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Setup environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Initialize database:
```bash
# Create database and enable PostGIS
createdb turnotec
psql turnotec -c "CREATE EXTENSION postgis;"

# Run migrations
alembic upgrade head
```

5. Run development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

## 📚 Documentation

- API Docs: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## 🧪 Testing

```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run tests
pytest

# With coverage
pytest --cov=app --cov-report=html
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py           # FastAPI application entry point
│   ├── config.py         # Configuration management
│   ├── database.py       # Database setup
│   ├── dependencies.py   # FastAPI dependencies
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   ├── api/v1/           # API routes
│   ├── services/         # Business logic
│   └── utils/            # Utility functions
├── alembic/              # Database migrations
├── tests/                # Test suite
├── requirements.txt      # Production dependencies
└── requirements-dev.txt  # Development dependencies
```

## 🔧 Development

### Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

### Code Quality

```bash
# Format code
black app

# Sort imports
isort app

# Linting
flake8 app

# Type checking
mypy app
```

## 🌐 Environment Variables

See [.env.example](.env.example) for all available configuration options.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `SECRET_KEY`: JWT secret key (generate with `openssl rand -hex 32`)

## 🐳 Docker (Optional)

```bash
# Build image
docker build -t turnotec-backend .

# Run container
docker run -p 8000:8000 --env-file .env turnotec-backend
```

## 📝 License

MIT License - see [LICENSE](../LICENSE)
