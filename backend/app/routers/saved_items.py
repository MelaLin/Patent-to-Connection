from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Dict, Any, Optional
import logging
import json
import hashlib
from datetime import datetime
from app.core.database import get_db
from app.models.saved_items import SavedPatent, SavedInventor, SavedQuery, SavedAlert
from app.schemas.saved_items import (
    SavedPatentCreate, SavedPatentResponse, 
    SavedInventorCreate, SavedInventorResponse,
    SavedQueryCreate, SavedQueryResponse,
    SavedAlertCreate, SavedAlertResponse,
    SavePatentRequest, SavePatentResponse,
    SaveQueryRequest, SaveQueryResponse,
    WatchlistResponse
)
from app.services.storage import storage_service

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Mock user authentication - replace with real auth later
def get_current_user_id() -> str:
    """Mock function to get current user ID. Replace with real authentication."""
    return "dev"  # Use "dev" for development namespace

def get_body(req: Request) -> Dict[str, Any]:
    """Safely parse request body, handling double-stringified JSON"""
    try:
        body = req.body()
        if isinstance(body, str):
            try:
                return json.loads(body)
            except json.JSONDecodeError:
                pass
        return body
    except Exception as e:
        logger.error(f"Error parsing request body: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON in request body")

def hash_query(query: str, filters: Optional[Dict[str, Any]] = None) -> str:
    """Create a hash for query + filters for idempotency"""
    content = json.dumps({"query": query, "filters": filters}, sort_keys=True)
    return hashlib.sha256(content.encode()).hexdigest()

# New API contract endpoints
@router.post("/watchlist/patents", response_model=SavePatentResponse)
async def save_patent_new(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Save a patent with idempotent upsert on patentNumber"""
    try:
        # Parse and validate request body
        body = get_body(request)
        logger.debug(f"POST /api/watchlist/patents body: {body}")
        
        patent_data = SavePatentRequest(**body)
        
        # Convert inventors from list of strings to list of dicts for compatibility
        inventors_dict = [{"name": inv} for inv in patent_data.inventors]
        
        # Prepare data for upsert
        upsert_data = {
            "patent_number": patent_data.patentNumber,
            "title": patent_data.title,
            "abstract": patent_data.abstract,
            "assignee": patent_data.assignee,
            "inventors": inventors_dict,
            "link": patent_data.googlePatentsLink,
            "date_filed": patent_data.filingDate,
            "google_patents_link": patent_data.googlePatentsLink,
            "tags": patent_data.tags or [],
            "user_id": current_user_id
        }
        
        if storage_service.use_database:
            # Use database storage with upsert
            await db.execute("SELECT 1")  # Test connection
            
            # Check if patent already exists
            result = await db.execute(
                select(SavedPatent).where(
                    and_(
                        SavedPatent.patent_number == patent_data.patentNumber,
                        SavedPatent.user_id == current_user_id
                    )
                )
            )
            existing_patent = result.scalar_one_or_none()
            
            if existing_patent:
                # Update existing patent
                for key, value in upsert_data.items():
                    if key != "patent_number" and key != "user_id":
                        setattr(existing_patent, key, value)
                existing_patent.updated_at = datetime.now()
                await db.commit()
                await db.refresh(existing_patent)
                logger.info(f"Updated existing patent: {existing_patent.id}")
                return SavePatentResponse(ok=True, patent=existing_patent.__dict__)
            else:
                # Create new patent
                db_patent = SavedPatent(**upsert_data)
                db.add(db_patent)
                await db.commit()
                await db.refresh(db_patent)
                logger.info(f"Created new patent: {db_patent.id}")
                return SavePatentResponse(ok=True, patent=db_patent.__dict__)
        else:
            # Use file storage
            patent_record = storage_service.save_patent_file(upsert_data, current_user_id)
            logger.info(f"Saved patent to file: {patent_record['id']}")
            return SavePatentResponse(ok=True, patent=patent_record)
            
    except Exception as e:
        logger.error(f"save patent error: {e}", exc_info=True)
        return SavePatentResponse(ok=False, error=str(e))

@router.post("/watchlist/queries", response_model=SaveQueryResponse)
async def save_query_new(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Save a query with idempotent upsert on hash"""
    try:
        # Parse and validate request body
        body = get_body(request)
        logger.debug(f"POST /api/watchlist/queries body: {body}")
        
        query_data = SaveQueryRequest(**body)
        
        # Create hash for idempotency
        query_hash = hash_query(query_data.query, query_data.filters)
        
        # Prepare data for upsert
        upsert_data = {
            "query": query_data.query,
            "filters": query_data.filters,
            "hash": query_hash,
            "user_id": current_user_id
        }
        
        if storage_service.use_database:
            # Use database storage with upsert
            await db.execute("SELECT 1")  # Test connection
            
            # Check if query already exists
            result = await db.execute(
                select(SavedQuery).where(
                    and_(
                        SavedQuery.hash == query_hash,
                        SavedQuery.user_id == current_user_id
                    )
                )
            )
            existing_query = result.scalar_one_or_none()
            
            if existing_query:
                # Update existing query
                existing_query.query = query_data.query
                existing_query.filters = query_data.filters
                existing_query.updated_at = datetime.now()
                await db.commit()
                await db.refresh(existing_query)
                logger.info(f"Updated existing query: {existing_query.id}")
                return SaveQueryResponse(ok=True, query=existing_query.__dict__)
            else:
                # Create new query
                db_query = SavedQuery(**upsert_data)
                db.add(db_query)
                await db.commit()
                await db.refresh(db_query)
                logger.info(f"Created new query: {db_query.id}")
                return SaveQueryResponse(ok=True, query=db_query.__dict__)
        else:
            # Use file storage
            query_record = storage_service.save_query_file(query_data.query, current_user_id)
            logger.info(f"Saved query to file: {query_record['id']}")
            return SaveQueryResponse(ok=True, query=query_record)
            
    except Exception as e:
        logger.error(f"save query error: {e}", exc_info=True)
        return SaveQueryResponse(ok=False, error=str(e))

@router.get("/watchlist", response_model=WatchlistResponse)
async def get_watchlist_new(
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all saved patents and queries"""
    try:
        if storage_service.use_database:
            # Use database storage
            await db.execute("SELECT 1")  # Test connection
            
            # Get saved patents
            patents_result = await db.execute(
                select(SavedPatent)
                .where(SavedPatent.user_id == current_user_id)
                .order_by(SavedPatent.created_at.desc())
            )
            patents = patents_result.scalars().all()
            
            # Get saved queries
            queries_result = await db.execute(
                select(SavedQuery)
                .where(SavedQuery.user_id == current_user_id)
                .order_by(SavedQuery.created_at.desc())
            )
            queries = queries_result.scalars().all()
            
            return WatchlistResponse(
                ok=True,
                patents=[patent.__dict__ for patent in patents],
                queries=[query.__dict__ for query in queries]
            )
        else:
            # Use file storage
            watchlist_data = storage_service.get_watchlist_file(current_user_id)
            return WatchlistResponse(
                ok=True,
                patents=watchlist_data.get("patents", []),
                queries=watchlist_data.get("queries", [])
            )
            
    except Exception as e:
        logger.error(f"fetch watchlist error: {e}", exc_info=True)
        return WatchlistResponse(ok=False, error="Server error")

# Legacy endpoints for backward compatibility
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
