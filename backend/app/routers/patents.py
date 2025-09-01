from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.core.database import get_db
from app.models.patent import Patent
from app.schemas.patent import PatentCreate, PatentResponse, PatentUpdate
from app.services.serpapi import SerpAPIService
from app.services.patentsview import PatentsViewService

router = APIRouter()
serpapi_service = SerpAPIService()
patentsview_service = PatentsViewService()

@router.get("/patents", response_model=List[PatentResponse])
async def get_patents(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get all patents with pagination"""
    result = await db.execute(select(Patent).offset(skip).limit(limit))
    patents = result.scalars().all()
    return patents

@router.get("/patents/{patent_number}", response_model=PatentResponse)
async def get_patent(patent_number: str, db: AsyncSession = Depends(get_db)):
    """Get a specific patent by patent number"""
    result = await db.execute(select(Patent).where(Patent.patent_number == patent_number))
    patent = result.scalar_one_or_none()
    
    if not patent:
        raise HTTPException(status_code=404, detail="Patent not found")
    
    return patent

@router.post("/patents", response_model=PatentResponse)
async def create_patent(patent: PatentCreate, db: AsyncSession = Depends(get_db)):
    """Create a new patent"""
    # Check if patent already exists
    result = await db.execute(select(Patent).where(Patent.patent_number == patent.patent_number))
    existing_patent = result.scalar_one_or_none()
    
    if existing_patent:
        raise HTTPException(status_code=400, detail="Patent already exists")
    
    db_patent = Patent(**patent.model_dump())
    db.add(db_patent)
    await db.commit()
    await db.refresh(db_patent)
    
    return db_patent

@router.put("/patents/{patent_number}", response_model=PatentResponse)
async def update_patent(
    patent_number: str,
    patent_update: PatentUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a patent"""
    result = await db.execute(select(Patent).where(Patent.patent_number == patent_number))
    patent = result.scalar_one_or_none()
    
    if not patent:
        raise HTTPException(status_code=404, detail="Patent not found")
    
    update_data = patent_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patent, field, value)
    
    await db.commit()
    await db.refresh(patent)
    
    return patent

@router.delete("/patents/{patent_number}")
async def delete_patent(patent_number: str, db: AsyncSession = Depends(get_db)):
    """Delete a patent"""
    result = await db.execute(select(Patent).where(Patent.patent_number == patent_number))
    patent = result.scalar_one_or_none()
    
    if not patent:
        raise HTTPException(status_code=404, detail="Patent not found")
    
    await db.delete(patent)
    await db.commit()
    
    return {"message": "Patent deleted successfully"}

@router.get("/patents/search/serpapi")
async def search_patents_serpapi(
    query: str = Query(..., description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Number of results")
):
    """Search patents using SerpAPI"""
    try:
        patents = await serpapi_service.search_patents(query, limit)
        return {
            "results": patents,
            "query": query,
            "count": len(patents),
            "source": "serpapi"
        }
    except HTTPException:
        # Re-raise HTTPExceptions as they already have proper status codes
        raise
    except Exception as e:
        # Handle any other unexpected errors
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/patents/search/patentsview")
async def search_patents_patentsview(
    query: str = Query(..., description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Number of results")
):
    """Search patents using PatentsView API"""
    try:
        patents = await patentsview_service.search_patents(query, limit)
        return {"patents": patents, "query": query, "count": len(patents)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/patents/{patent_number}/details")
async def get_patent_details(patent_number: str):
    """Get detailed patent information from external APIs"""
    try:
        # Try SerpAPI first
        patent_details = await serpapi_service.get_patent_details(patent_number)
        if patent_details:
            return {"source": "serpapi", "patent": patent_details}
        
        # Fallback to PatentsView
        patent_details = await patentsview_service.get_patent_details(patent_number)
        if patent_details:
            return {"source": "patentsview", "patent": patent_details}
        
        raise HTTPException(status_code=404, detail="Patent not found in external sources")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
