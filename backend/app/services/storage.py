import json
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.models.saved_items import SavedPatent, SavedInventor, SavedQuery, SavedAlert

logger = logging.getLogger(__name__)

class StorageService:
    """Service to handle both database and file-based storage"""
    
    def __init__(self):
        self.data_dir = Path("data")
        self.use_database = bool(settings.DATABASE_URL and settings.DATABASE_URL != "postgresql+asyncpg://user:password@localhost/patent_forge")
        
        # Create data directory if using file storage
        if not self.use_database:
            self.data_dir.mkdir(exist_ok=True)
            logger.info(f"Using file-based storage in {self.data_dir}")
        else:
            logger.info("Using database storage")
    
    def _get_file_path(self, filename: str) -> Path:
        """Get the full path for a data file"""
        return self.data_dir / filename
    
    def _load_json_file(self, filename: str) -> List[Dict[str, Any]]:
        """Load data from a JSON file"""
        file_path = self._get_file_path(filename)
        if file_path.exists():
            try:
                with open(file_path, 'r') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                logger.error(f"Error loading {filename}: {e}")
                return []
        return []
    
    def _save_json_file(self, filename: str, data: List[Dict[str, Any]]) -> bool:
        """Save data to a JSON file"""
        try:
            file_path = self._get_file_path(filename)
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=2, default=str)
            return True
        except IOError as e:
            logger.error(f"Error saving {filename}: {e}")
            return False
    
    # Database methods
    async def save_patent_db(self, db: AsyncSession, patent_data: Dict[str, Any], user_id: str) -> SavedPatent:
        """Save patent to database"""
        db_patent = SavedPatent(
            title=patent_data["title"],
            abstract=patent_data["abstract"],
            assignee=patent_data["assignee"],
            inventors=patent_data["inventors"],
            link=patent_data.get("link"),
            date_filed=patent_data.get("date_filed"),
            user_id=user_id
        )
        db.add(db_patent)
        await db.commit()
        await db.refresh(db_patent)
        return db_patent
    
    async def save_query_db(self, db: AsyncSession, query: str, user_id: str) -> SavedQuery:
        """Save query to database"""
        db_query = SavedQuery(query=query, user_id=user_id)
        db.add(db_query)
        await db.commit()
        await db.refresh(db_query)
        return db_query
    
    async def save_alert_db(self, db: AsyncSession, query: str, frequency: str, user_id: str) -> SavedAlert:
        """Save alert to database"""
        db_alert = SavedAlert(query=query, frequency=frequency, user_id=user_id)
        db.add(db_alert)
        await db.commit()
        await db.refresh(db_alert)
        return db_alert
    
    # File methods
    def save_patent_file(self, patent_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Save patent to file"""
        patents = self._load_json_file("patents.json")
        
        patent_record = {
            "id": len(patents) + 1,
            "title": patent_data["title"],
            "abstract": patent_data["abstract"],
            "assignee": patent_data["assignee"],
            "inventors": patent_data["inventors"],
            "link": patent_data.get("link"),
            "date_filed": patent_data.get("date_filed"),
            "user_id": user_id,
            "created_at": datetime.now().isoformat()
        }
        
        patents.append(patent_record)
        if self._save_json_file("patents.json", patents):
            return patent_record
        raise Exception("Failed to save patent to file")
    
    def save_query_file(self, query: str, user_id: str) -> Dict[str, Any]:
        """Save query to file"""
        queries = self._load_json_file("queries.json")
        
        query_record = {
            "id": len(queries) + 1,
            "query": query,
            "user_id": user_id,
            "created_at": datetime.now().isoformat()
        }
        
        queries.append(query_record)
        if self._save_json_file("queries.json", queries):
            return query_record
        raise Exception("Failed to save query to file")
    
    def save_alert_file(self, query: str, frequency: str, user_id: str) -> Dict[str, Any]:
        """Save alert to file"""
        alerts = self._load_json_file("alerts.json")
        
        alert_record = {
            "id": len(alerts) + 1,
            "query": query,
            "frequency": frequency,
            "user_id": user_id,
            "created_at": datetime.now().isoformat()
        }
        
        alerts.append(alert_record)
        if self._save_json_file("alerts.json", alerts):
            return alert_record
        raise Exception("Failed to save alert to file")

# Global storage service instance
storage_service = StorageService()
