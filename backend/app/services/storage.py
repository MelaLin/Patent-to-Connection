import json
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class StorageService:
    """Service to handle file-based storage only"""
    
    def __init__(self):
        self.data_dir = Path("data")
        self.use_database = False  # Force file storage for now
        
        # Create data directory
        self.data_dir.mkdir(exist_ok=True)
        logger.info(f"Using file-based storage in {self.data_dir}")
    
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
    
    # File methods
    def save_patent_file(self, patent_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Save patent to file"""
        patents = self._load_json_file("patents.json")
        
        patent_record = {
            "id": len(patents) + 1,
            "patent_number": patent_data.get("patent_number"),
            "title": patent_data["title"],
            "abstract": patent_data["abstract"],
            "assignee": patent_data["assignee"],
            "inventors": patent_data["inventors"],
            "link": patent_data.get("link"),
            "date_filed": patent_data.get("date_filed"),
            "google_patents_link": patent_data.get("google_patents_link"),
            "tags": patent_data.get("tags", []),
            "user_id": user_id,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        patents.append(patent_record)
        if self._save_json_file("patents.json", patents):
            return patent_record
        raise Exception("Failed to save patent to file")
    
    def save_query_file(self, query: str, user_id: str, filters: Optional[Dict[str, Any]] = None, hash_value: Optional[str] = None) -> Dict[str, Any]:
        """Save query to file"""
        queries = self._load_json_file("queries.json")
        
        query_record = {
            "id": len(queries) + 1,
            "query": query,
            "filters": filters,
            "hash": hash_value,
            "user_id": user_id,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
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
    
    # Watchlist methods
    def get_watchlist_file(self, user_id: str) -> Dict[str, Any]:
        """Get all saved patents and queries from files"""
        try:
            patents = self._load_json_file("patents.json")
            queries = self._load_json_file("queries.json")
            
            # Filter by user_id
            user_patents = [p for p in patents if p.get("user_id") == user_id]
            user_queries = [q for q in queries if q.get("user_id") == user_id]
            
            return {
                "patents": user_patents,
                "queries": user_queries
            }
        except Exception as e:
            logger.error(f"Error fetching watchlist from files: {e}")
            raise

# Global storage service instance
storage_service = StorageService()
