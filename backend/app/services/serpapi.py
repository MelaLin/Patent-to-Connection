import httpx
from typing import Dict, List, Optional
from app.core.config import settings

class SerpAPIService:
    def __init__(self):
        self.api_key = settings.SERPAPI_API_KEY
        self.base_url = "https://serpapi.com/search"
    
    async def search_patents(self, query: str, limit: int = 10) -> List[Dict]:
        """Search for patents using SerpAPI"""
        if not self.api_key:
            raise ValueError("SERPAPI_API_KEY not configured")
        
        params = {
            "api_key": self.api_key,
            "engine": "google_patents",
            "q": query,
            "num": limit
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            patents = []
            if "patents_results" in data:
                for patent in data["patents_results"]:
                    patents.append({
                        "patent_number": patent.get("patent_number"),
                        "title": patent.get("title"),
                        "abstract": patent.get("abstract"),
                        "inventors": patent.get("inventors"),
                        "assignee": patent.get("assignee"),
                        "filing_date": patent.get("filing_date"),
                        "publication_date": patent.get("publication_date"),
                        "grant_date": patent.get("grant_date"),
                        "status": patent.get("status"),
                        "patent_class": patent.get("patent_class")
                    })
            
            return patents
    
    async def get_patent_details(self, patent_number: str) -> Optional[Dict]:
        """Get detailed information about a specific patent"""
        if not self.api_key:
            raise ValueError("SERPAPI_API_KEY not configured")
        
        params = {
            "api_key": self.api_key,
            "engine": "google_patents",
            "patent_number": patent_number
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if "patent_results" in data and data["patent_results"]:
                patent = data["patent_results"][0]
                return {
                    "patent_number": patent.get("patent_number"),
                    "title": patent.get("title"),
                    "abstract": patent.get("abstract"),
                    "inventors": patent.get("inventors"),
                    "assignee": patent.get("assignee"),
                    "filing_date": patent.get("filing_date"),
                    "publication_date": patent.get("publication_date"),
                    "grant_date": patent.get("grant_date"),
                    "status": patent.get("status"),
                    "patent_class": patent.get("patent_class")
                }
            
            return None
