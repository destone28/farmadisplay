"""Application configuration."""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings."""
    
    # Application
    APP_NAME: str = "FarmaDisplay API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost/farmadisplay"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # JWT Security
    JWT_SECRET_KEY: str = "your-secret-key-here-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Legacy JWT fields (for backward compatibility)
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24
    
    # Security
    BCRYPT_ROUNDS: int = 12
    MAX_FAILED_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15
    
    # Logging
    LOG_LEVEL: str = "INFO"
    SECURITY_LOG_FILE: str = "/var/log/pharmdisplay/security.log"
    
    # Email (optional)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    ADMIN_EMAIL: str = "admin@farmadisplay.com"
    
    # Sentry (optional)
    SENTRY_DSN: str | None = None
    
    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"]
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"  # Ignora campi extra invece di dare errore
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()