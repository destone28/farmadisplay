"""FastAPI dependencies."""

from typing import Annotated
from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import Settings, get_settings

# Type aliases for dependency injection
DatabaseSession = Annotated[Session, Depends(get_db)]
AppSettings = Annotated[Settings, Depends(get_settings)]
