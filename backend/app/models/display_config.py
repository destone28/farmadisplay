"""Display configuration model."""

from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class DisplayMode(str, enum.Enum):
    """Modalità visualizzazione display."""
    IMAGE = "image"  # Immagine statica
    SCRAPED = "scraped"  # Dati da farmaciediturno.org
    MANUAL = "manual"  # Turni inseriti manualmente


class DisplayConfig(Base):
    """Configurazione display per farmacia."""

    __tablename__ = "display_configs"

    id = Column(Integer, primary_key=True, index=True)
    pharmacy_id = Column(String(36), ForeignKey("pharmacies.id"), unique=True, nullable=False)

    # Header configuration
    logo_path = Column(String(500), nullable=True)  # Path al logo
    pharmacy_name = Column(String(200), nullable=False)
    pharmacy_hours = Column(Text, nullable=True)  # JSON con orari strutturati
    subtitle_text = Column(String(200), default="Farmacie di turno")  # Sottotitolo personalizzabile

    # Display mode
    display_mode = Column(SQLEnum(DisplayMode), default=DisplayMode.IMAGE, nullable=False)

    # Image mode configuration
    image_path = Column(String(500), nullable=True)  # Path immagine principale

    # Scraped mode configuration
    scraping_cap = Column(String(10), nullable=True)  # CAP per ricerca
    scraping_city = Column(String(200), nullable=True)  # Comune
    scraping_province = Column(String(2), nullable=True)  # Sigla provincia

    # Footer configuration
    footer_text = Column(Text, nullable=True)

    # Styling - Theme based
    theme = Column(String(20), default="light")  # light, dark, custom
    primary_color = Column(String(7), default="#0066CC")  # Colore principale farmacia
    secondary_color = Column(String(7), default="#00A3E0")  # Colore secondario farmacia

    # Relationship
    pharmacy = relationship("Pharmacy", back_populates="display_config")
