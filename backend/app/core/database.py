from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from app.core.config import settings
import os

def get_database_url():
    """Get database URL with proper handling for Render's format"""
    database_url = settings.DATABASE_URL
    
    # Handle Render's database URL format
    if '<port>' in database_url:
        # Replace placeholder with actual port (usually 5432 for PostgreSQL)
        database_url = database_url.replace('<port>', '5432')
    
    # Handle other potential placeholders
    if '<host>' in database_url:
        database_url = database_url.replace('<host>', 'localhost')
    
    return database_url

# Create async engine
engine = create_async_engine(
    get_database_url(),
    echo=settings.DEBUG,
    future=True
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Create base class for models
Base = declarative_base()

# Import all models to ensure they are registered with SQLAlchemy
from app.models.saved_items import SavedPatent, SavedInventor

# Dependency to get database session
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
