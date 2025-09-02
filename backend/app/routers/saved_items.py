from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from app.core.database import get_db
from app.models.saved_items import SavedPatent, SavedInventor
from app.schemas.saved_items import SavedPatentCreate, SavedPatentResponse, SavedInventorCreate, SavedInventorResponse

router = APIRouter()

# Mock user authentication - replace with real auth later
def get_current_user_id() -> str:
    """Mock function to get current user ID. Replace with real authentication."""
    return "user_123"  # Hardcoded for now

@router.post("/patents/save", response_model=SavedPatentResponse)
async def save_patent(
    patent_data: SavedPatentCreate,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Save a patent to the database"""
    try:
        # Check if patent already exists for this user
        existing_patent = await db.execute(
            select(SavedPatent).where(
                and_(
                    SavedPatent.title == patent_data.title,
                    SavedPatent.user_id == current_user_id
                )
            )
        )
        
        if existing_patent.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Patent already saved")
        
        # Create new saved patent
        db_patent = SavedPatent(
            title=patent_data.title,
            abstract=patent_data.abstract,
            assignee=patent_data.assignee,
            inventors=patent_data.inventors,
            link=patent_data.link,
            date_filed=patent_data.date_filed,
            user_id=current_user_id
        )
        
        db.add(db_patent)
        await db.commit()
        await db.refresh(db_patent)
        
        return db_patent
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save patent: {str(e)}")

@router.get("/patents/saved", response_model=List[SavedPatentResponse])
async def get_saved_patents(
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all patents saved by the current user"""
    try:
        result = await db.execute(
            select(SavedPatent)
            .where(SavedPatent.user_id == current_user_id)
            .order_by(SavedPatent.created_at.desc())
        )
        patents = result.scalars().all()
        return patents
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch saved patents: {str(e)}")

@router.post("/inventors/save", response_model=SavedInventorResponse)
async def save_inventor(
    inventor_data: SavedInventorCreate,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Save an inventor to the database"""
    try:
        # Check if inventor already exists for this user
        existing_inventor = await db.execute(
            select(SavedInventor).where(
                and_(
                    SavedInventor.name == inventor_data.name,
                    SavedInventor.user_id == current_user_id
                )
            )
        )
        
        if existing_inventor.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Inventor already saved")
        
        # Create new saved inventor
        db_inventor = SavedInventor(
            name=inventor_data.name,
            linkedin_url=inventor_data.linkedin_url,
            associated_patent_id=inventor_data.associated_patent_id,
            user_id=current_user_id
        )
        
        db.add(db_inventor)
        await db.commit()
        await db.refresh(db_inventor)
        
        return db_inventor
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save inventor: {str(e)}")

@router.get("/inventors/saved", response_model=List[SavedInventorResponse])
async def get_saved_inventors(
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all inventors saved by the current user"""
    try:
        result = await db.execute(
            select(SavedInventor)
            .where(SavedInventor.user_id == current_user_id)
            .order_by(SavedInventor.created_at.desc())
        )
        inventors = result.scalars().all()
        return inventors
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch saved inventors: {str(e)}")
