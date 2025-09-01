from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost/patent_forge"
    
    # API Keys
    SERPAPI_API_KEY: str = ""
    
    # External APIs
    PATENTSVIEW_BASE: str = "https://developer.uspto.gov/ds-api"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["*"]
    
    # App settings
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
