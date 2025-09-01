import httpx
from typing import Dict, List, Optional
from app.core.config import settings

class PatentsViewService:
    def __init__(self):
        self.base_url = settings.PATENTSVIEW_BASE
    
    async def search_patents(self, query: str, limit: int = 10) -> List[Dict]:
        """Search for patents using USPTO PatentsView API"""
        params = {
            "q": query,
            "f": "patent_number,patent_title,patent_abstract,inventor_name,assignee_name,filing_date,patent_date,patent_kind",
            "s": "patent_date desc",
            "o": limit
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/patents", params=params)
            response.raise_for_status()
            data = response.json()
            
            patents = []
            if "patents" in data:
                for patent in data["patents"]:
                    patents.append({
                        "patent_number": patent.get("patent_number"),
                        "title": patent.get("patent_title"),
                        "abstract": patent.get("patent_abstract"),
                        "inventors": patent.get("inventor_name"),
                        "assignee": patent.get("assignee_name"),
                        "filing_date": patent.get("filing_date"),
                        "publication_date": patent.get("patent_date"),
                        "status": patent.get("patent_kind")
                    })
            
            return patents
    
    async def get_patent_details(self, patent_number: str) -> Optional[Dict]:
        """Get detailed information about a specific patent"""
        params = {
            "q": f'patent_number:"{patent_number}"',
            "f": "patent_number,patent_title,patent_abstract,inventor_name,assignee_name,filing_date,patent_date,patent_kind,patent_class"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/patents", params=params)
            response.raise_for_status()
            data = response.json()
            
            if "patents" in data and data["patents"]:
                patent = data["patents"][0]
                return {
                    "patent_number": patent.get("patent_number"),
                    "title": patent.get("patent_title"),
                    "abstract": patent.get("patent_abstract"),
                    "inventors": patent.get("inventor_name"),
                    "assignee": patent.get("assignee_name"),
                    "filing_date": patent.get("filing_date"),
                    "publication_date": patent.get("patent_date"),
                    "status": patent.get("patent_kind"),
                    "patent_class": patent.get("patent_class")
                }
            
            return None
    
    async def get_patent_status(self, patent_number: str) -> Optional[Dict]:
        """Get current status of a patent"""
        params = {
            "q": f'patent_number:"{patent_number}"',
            "f": "patent_number,patent_kind,patent_date"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/patents", params=params)
            response.raise_for_status()
            data = response.json()
            
            if "patents" in data and data["patents"]:
                patent = data["patents"][0]
                return {
                    "patent_number": patent.get("patent_number"),
                    "status": patent.get("patent_kind"),
                    "grant_date": patent.get("patent_date")
                }
            
            return None
