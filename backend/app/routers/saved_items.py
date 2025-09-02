from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Dict, Any
import logging
from datetime import datetime
from app.core.database import get_db
from app.models.saved_items import SavedPatent, SavedInventor, SavedQuery, SavedAlert
from app.schemas.saved_items import (
    SavedPatentCreate, SavedPatentResponse, 
    SavedInventorCreate, SavedInventorResponse,
    SavedQueryCreate, SavedQueryResponse,
    SavedAlertCreate, SavedAlertResponse
)
from app.services.storage import storage_service

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Mock user authentication - replace with real auth later
def get_current_user_id() -> str:
    """Mock function to get current user ID. Replace with real authentication."""
    return "user_123"  # Hardcoded for now

# Patent endpoints
@router.post("/savePatent", response_model=Dict[str, Any])
async def save_patent(
    patent_data: SavedPatentCreate,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Save a patent to the database or file storage"""
    logger.info(f"Saving patent: {patent_data.title}")
    
    try:
        if storage_service.use_database:
            # Use database storage
            await db.execute("SELECT 1")  # Test connection
            db_patent = await storage_service.save_patent_db(db, patent_data.model_dump(), current_user_id)
            logger.info(f"Successfully saved patent with ID: {db_patent.id}")
            return {"success": True, "data": db_patent}
        else:
            # Use file storage
            patent_record = storage_service.save_patent_file(patent_data.model_dump(), current_user_id)
            logger.info(f"Successfully saved patent with ID: {patent_record['id']}")
            return {"success": True, "data": patent_record}
            
    except Exception as e:
        logger.error(f"Failed to save patent: {str(e)}", exc_info=True)
        return {"success": False, "error": str(e)}

@router.post("/patents/save", response_model=SavedPatentResponse)
async def save_patent_legacy(
    patent_data: SavedPatentCreate,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Legacy endpoint for saving a patent"""
    result = await save_patent(patent_data, db, current_user_id)
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["error"])
    return result["data"]

@router.get("/patents/saved", response_model=List[SavedPatentResponse])
async def get_saved_patents(
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all patents saved by the current user"""
    logger.info(f"Fetching saved patents for user: {current_user_id}")
    
    try:
        if storage_service.use_database:
            # Use database storage
            result = await db.execute(
                select(SavedPatent)
                .where(SavedPatent.user_id == current_user_id)
                .order_by(SavedPatent.created_at.desc())
            )
            patents = result.scalars().all()
            logger.info(f"Found {len(patents)} saved patents for user {current_user_id}")
            return patents
        else:
            # Use file storage
            patents = storage_service._load_json_file("patents.json")
            user_patents = [p for p in patents if p.get("user_id") == current_user_id]
            logger.info(f"Found {len(user_patents)} saved patents for user {current_user_id}")
            return [SavedPatentResponse(**p) for p in user_patents]
            
    except Exception as e:
        logger.error(f"Failed to fetch saved patents: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch saved patents: {str(e)}")

# Query endpoints
@router.post("/saveQuery", response_model=Dict[str, Any])
async def save_query(
    query_data: SavedQueryCreate,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Save a search query"""
    logger.info(f"Saving query: {query_data.query}")
    
    try:
        if storage_service.use_database:
            # Use database storage
            await db.execute("SELECT 1")  # Test connection
            db_query = await storage_service.save_query_db(db, query_data.query, current_user_id)
            logger.info(f"Successfully saved query with ID: {db_query.id}")
            return {"success": True, "data": db_query}
        else:
            # Use file storage
            query_record = storage_service.save_query_file(query_data.query, current_user_id)
            logger.info(f"Successfully saved query with ID: {query_record['id']}")
            return {"success": True, "data": query_record}
            
    except Exception as e:
        logger.error(f"Failed to save query: {str(e)}", exc_info=True)
        return {"success": False, "error": str(e)}

@router.get("/queries/saved", response_model=List[SavedQueryResponse])
async def get_saved_queries(
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all queries saved by the current user"""
    logger.info(f"Fetching saved queries for user: {current_user_id}")
    
    try:
        if storage_service.use_database:
            # Use database storage
            result = await db.execute(
                select(SavedQuery)
                .where(SavedQuery.user_id == current_user_id)
                .order_by(SavedQuery.created_at.desc())
            )
            queries = result.scalars().all()
            logger.info(f"Found {len(queries)} saved queries for user {current_user_id}")
            return queries
        else:
            # Use file storage
            queries = storage_service._load_json_file("queries.json")
            user_queries = [q for q in queries if q.get("user_id") == current_user_id]
            logger.info(f"Found {len(user_queries)} saved queries for user {current_user_id}")
            return [SavedQueryResponse(**q) for q in user_queries]
            
    except Exception as e:
        logger.error(f"Failed to fetch saved queries: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch saved queries: {str(e)}")

# Watchlist endpoint
@router.get("/watchlist", response_model=Dict[str, Any])
async def get_watchlist(
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all saved patents and queries for the current user"""
    logger.info(f"Fetching watchlist for user: {current_user_id}")
    
    try:
        if storage_service.use_database:
            # Use database storage
            watchlist_data = await storage_service.get_watchlist_db(db, current_user_id)
        else:
            # Use file storage
            watchlist_data = storage_service.get_watchlist_file(current_user_id)
        
        logger.info(f"Found {len(watchlist_data['patents'])} patents and {len(watchlist_data['queries'])} queries for user {current_user_id}")
        return watchlist_data
        
    except Exception as e:
        logger.error(f"Failed to fetch watchlist: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch watchlist: {str(e)}")

# Alert endpoints
@router.post("/createAlert", response_model=SavedAlertResponse)
async def create_alert(
    alert_data: SavedAlertCreate,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Create a new alert"""
    logger.info(f"Creating alert for query: {alert_data.query} with frequency: {alert_data.frequency}")
    
    # Validate frequency
    valid_frequencies = ["daily", "weekly", "monthly"]
    if alert_data.frequency not in valid_frequencies:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid frequency. Must be one of: {', '.join(valid_frequencies)}"
        )
    
    try:
        if storage_service.use_database:
            # Use database storage
            await db.execute("SELECT 1")  # Test connection
            db_alert = await storage_service.save_alert_db(db, alert_data.query, alert_data.frequency, current_user_id)
            logger.info(f"Successfully created alert with ID: {db_alert.id}")
            return db_alert
        else:
            # Use file storage
            alert_record = storage_service.save_alert_file(alert_data.query, alert_data.frequency, current_user_id)
            logger.info(f"Successfully created alert with ID: {alert_record['id']}")
            return SavedAlertResponse(**alert_record)
            
    except Exception as e:
        logger.error(f"Failed to create alert: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create alert: {str(e)}")

@router.get("/alerts/saved", response_model=List[SavedAlertResponse])
async def get_saved_alerts(
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all alerts saved by the current user"""
    logger.info(f"Fetching saved alerts for user: {current_user_id}")
    
    try:
        if storage_service.use_database:
            # Use database storage
            result = await db.execute(
                select(SavedAlert)
                .where(SavedAlert.user_id == current_user_id)
                .order_by(SavedAlert.created_at.desc())
            )
            alerts = result.scalars().all()
            logger.info(f"Found {len(alerts)} saved alerts for user {current_user_id}")
            return alerts
        else:
            # Use file storage
            alerts = storage_service._load_json_file("alerts.json")
            user_alerts = [a for a in alerts if a.get("user_id") == current_user_id]
            logger.info(f"Found {len(user_alerts)} saved alerts for user {current_user_id}")
            return [SavedAlertResponse(**a) for a in user_alerts]
            
    except Exception as e:
        logger.error(f"Failed to fetch saved alerts: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch saved alerts: {str(e)}")

# Inventor endpoints (keeping existing ones)
@router.post("/inventors/save", response_model=SavedInventorResponse)
async def save_inventor(
    inventor_data: SavedInventorCreate,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Save an inventor to the database"""
    logger.info(f"Saving inventor: {inventor_data.name}")
    logger.info(f"Inventor data: {inventor_data.model_dump()}")
    
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
            logger.warning(f"Inventor already saved for user {current_user_id}: {inventor_data.name}")
            raise HTTPException(status_code=400, detail="Inventor already saved")
        
        # Create new saved inventor
        db_inventor = SavedInventor(
            name=inventor_data.name,
            linkedin_url=inventor_data.linkedin_url,
            associated_patent_id=inventor_data.associated_patent_id,
            user_id=current_user_id
        )
        
        logger.info(f"Creating inventor record: {db_inventor.name}")
        db.add(db_inventor)
        await db.commit()
        await db.refresh(db_inventor)
        
        logger.info(f"Successfully saved inventor with ID: {db_inventor.id}")
        return db_inventor
        
    except HTTPException:
        # Re-raise HTTPExceptions as they already have proper status codes
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to save inventor: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to save inventor: {str(e)}")

@router.get("/inventors/saved", response_model=List[SavedInventorResponse])
async def get_saved_inventors(
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all inventors saved by the current user"""
    logger.info(f"Fetching saved inventors for user: {current_user_id}")
    
    try:
        result = await db.execute(
            select(SavedInventor)
            .where(SavedInventor.user_id == current_user_id)
            .order_by(SavedInventor.created_at.desc())
        )
        inventors = result.scalars().all()
        logger.info(f"Found {len(inventors)} saved inventors for user {current_user_id}")
        return inventors
        
    except Exception as e:
        logger.error(f"Failed to fetch saved inventors: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch saved inventors: {str(e)}")
