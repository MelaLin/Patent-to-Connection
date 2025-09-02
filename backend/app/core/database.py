from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import NullPool
from app.core.config import settings
import logging
import os

# Set up logging
logger = logging.getLogger(__name__)

def get_database_url():
    """Get database URL with proper handling for Render's format"""
    database_url = settings.DATABASE_URL
    
    logger.info(f"Original DATABASE_URL: {database_url}")
    
    # Handle Render's database URL format
    if '<port>' in database_url:
        # Replace placeholder with actual port (usually 5432 for PostgreSQL)
        database_url = database_url.replace('<port>', '5432')
        logger.info("Replaced <port> with 5432")
    
    # Handle other potential placeholders
    if '<host>' in database_url:
        database_url = database_url.replace('<host>', 'localhost')
        logger.info("Replaced <host> with localhost")
    
    # Ensure we're using asyncpg for async connections
    if database_url.startswith('postgresql://'):
        database_url = database_url.replace('postgresql://', 'postgresql+asyncpg://', 1)
        logger.info("Updated to use asyncpg driver")
    
    logger.info(f"Final DATABASE_URL: {database_url}")
    return database_url

# Create async engine with proper connection settings
engine = create_async_engine(
    get_database_url(),
    echo=settings.DEBUG,
    future=True,
    poolclass=NullPool,  # Disable connection pooling for Render
    connect_args={
        "server_settings": {
            "application_name": "patent_forge_app"
        }
    }
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
            # Test the connection
            await session.execute("SELECT 1")
            logger.debug("Database connection successful")
            yield session
        except Exception as e:
            logger.error(f"Database connection failed: {str(e)}")
            await session.rollback()
            raise
        finally:
            await session.close()
