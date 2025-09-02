from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.services.serpapi import SerpAPIService

router = APIRouter()
serpapi_service = SerpAPIService()

@router.get("/patents/search/serpapi")
async def search_patents_serpapi(
    query: str = Query(..., description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Number of results"),
    start_year: Optional[int] = Query(None, ge=1900, le=2030, description="Start year for filtering"),
    end_year: Optional[int] = Query(None, ge=1900, le=2030, description="End year for filtering")
):
    """Search patents using SerpAPI with optional year filtering"""
    try:
        patents = await serpapi_service.search_patents(query, limit, start_year, end_year)
        return {
            "results": patents,
            "query": query,
            "count": len(patents),
            "source": "serpapi",
            "filters": {
                "start_year": start_year,
                "end_year": end_year
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/patents/search/patentsview")
async def search_patents_patentsview(
    query: str = Query(..., description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Number of results")
):
    """Search patents using PatentsView API"""
    try:
        # This would be implemented when we have the PatentsView service
        return {
            "results": [],
            "query": query,
            "count": 0,
            "source": "patentsview"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/patents/{patent_number}/details")
async def get_patent_details(patent_number: str):
    """Get detailed patent information"""
    try:
        details = await serpapi_service.get_patent_details(patent_number)
        return details
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get patent details: {str(e)}")
