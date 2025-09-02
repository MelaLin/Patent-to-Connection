from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import List, Dict, Any, Optional
import logging
import json
import hashlib
from datetime import datetime
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

def hash_query(query: str, filters: Optional[Dict[str, Any]] = None) -> str:
    """Create a hash for query + filters for idempotency"""
    content = json.dumps({"query": query, "filters": filters}, sort_keys=True)
    return hashlib.sha256(content.encode()).hexdigest()

# New API contract endpoints
@router.post("/watchlist/patents", response_model=SavePatentResponse)
async def save_patent_new(
    patent_data: SavePatentRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """Save a patent with idempotent upsert on patentNumber"""
    try:
        logger.debug(f"POST /api/watchlist/patents body: {patent_data}")
        
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
        
        # Use file storage
        patent_record = storage_service.save_patent_file(upsert_data, current_user_id)
        logger.info(f"Saved patent to file: {patent_record['id']}")
        return SavePatentResponse(ok=True, patent=patent_record)
            
    except Exception as e:
        logger.error(f"save patent error: {e}", exc_info=True)
        return SavePatentResponse(ok=False, error=str(e))

@router.post("/watchlist/queries", response_model=SaveQueryResponse)
async def save_query_new(
    query_data: SaveQueryRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """Save a query with idempotent upsert on hash"""
    try:
        logger.debug(f"POST /api/watchlist/queries body: {query_data}")
        
        # Create hash for idempotency
        query_hash = hash_query(query_data.query, query_data.filters)
        
        # Use file storage
        query_record = storage_service.save_query_file(query_data.query, current_user_id, query_data.filters, query_hash)
        logger.info(f"Saved query to file: {query_record['id']}")
        return SaveQueryResponse(ok=True, query=query_record)
            
    except Exception as e:
        logger.error(f"save query error: {e}", exc_info=True)
        return SaveQueryResponse(ok=False, error=str(e))

@router.get("/watchlist", response_model=WatchlistResponse)
async def get_watchlist_new(
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all saved patents and queries"""
    try:
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
    current_user_id: str = Depends(get_current_user_id)
):
    """Save a patent to file storage"""
    logger.info(f"Saving patent: {patent_data.title}")
    
    try:
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
    current_user_id: str = Depends(get_current_user_id)
):
    """Legacy endpoint for saving a patent"""
    result = await save_patent(patent_data, current_user_id)
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["error"])
    return result["data"]

@router.get("/patents/saved", response_model=List[SavedPatentResponse])
async def get_saved_patents(
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all patents saved by the current user"""
    logger.info(f"Fetching saved patents for user: {current_user_id}")
    
    try:
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
    current_user_id: str = Depends(get_current_user_id)
):
    """Save a search query"""
    logger.info(f"Saving query: {query_data.query}")
    
    try:
        # Use file storage
        query_record = storage_service.save_query_file(query_data.query, current_user_id)
        logger.info(f"Successfully saved query with ID: {query_record['id']}")
        return {"success": True, "data": query_record}
            
    except Exception as e:
        logger.error(f"Failed to save query: {str(e)}", exc_info=True)
        return {"success": False, "error": str(e)}

@router.get("/queries/saved", response_model=List[SavedQueryResponse])
async def get_saved_queries(
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all queries saved by the current user"""
    logger.info(f"Fetching saved queries for user: {current_user_id}")
    
    try:
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
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all saved patents and queries for the current user"""
    logger.info(f"Fetching watchlist for user: {current_user_id}")
    
    try:
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
        # Use file storage
        alert_record = storage_service.save_alert_file(alert_data.query, alert_data.frequency, current_user_id)
        logger.info(f"Successfully created alert with ID: {alert_record['id']}")
        return SavedAlertResponse(**alert_record)
            
    except Exception as e:
        logger.error(f"Failed to create alert: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create alert: {str(e)}")

@router.get("/alerts/saved", response_model=List[SavedAlertResponse])
async def get_saved_alerts(
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all alerts saved by the current user"""
    logger.info(f"Fetching saved alerts for user: {current_user_id}")
    
    try:
        # Use file storage
        alerts = storage_service._load_json_file("alerts.json")
        user_alerts = [a for a in alerts if a.get("user_id") == current_user_id]
        logger.info(f"Found {len(user_alerts)} saved alerts for user {current_user_id}")
        return [SavedAlertResponse(**a) for a in user_alerts]
            
    except Exception as e:
        logger.error(f"Failed to fetch saved alerts: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch saved alerts: {str(e)}")
