from pydantic import BaseModel, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
import hashlib

class SavePatentRequest(BaseModel):
    patentNumber: str
    title: str
    abstract: str
    assignee: str
    inventors: List[str]
    filingDate: Optional[str] = None
    googlePatentsLink: Optional[str] = None
    tags: Optional[List[str]] = None

    @validator('patentNumber')
    def validate_patent_number(cls, v):
        if len(v) < 3:
            raise ValueError('Patent number must be at least 3 characters')
        return v

    @validator('title')
    def validate_title(cls, v):
        if len(v) < 1:
            raise ValueError('Title cannot be empty')
        return v

class SavePatentResponse(BaseModel):
    ok: bool
    patent: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class SaveQueryRequest(BaseModel):
    query: str
    filters: Optional[Dict[str, Any]] = None

    @validator('query')
    def validate_query(cls, v):
        if len(v) < 1:
            raise ValueError('Query cannot be empty')
        return v

class SaveQueryResponse(BaseModel):
    ok: bool
    query: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class WatchlistResponse(BaseModel):
    ok: bool
    patents: List[Dict[str, Any]] = []
    queries: List[Dict[str, Any]] = []
    error: Optional[str] = None

# Legacy schemas for backward compatibility
class SavedPatentCreate(BaseModel):
    title: str
    abstract: str
    assignee: str
    inventors: List[dict]  # List of inventor objects
    link: Optional[str] = None
    date_filed: Optional[str] = None  # Changed to str to handle ISO strings
    # user_id is handled by the backend, not sent by frontend

class SavedPatentResponse(BaseModel):
    id: int
    title: str
    abstract: str
    assignee: str
    inventors: List[dict]
    link: Optional[str] = None
    date_filed: Optional[datetime] = None
    user_id: str
    created_at: datetime

class SavedInventorCreate(BaseModel):
    name: str
    linkedin_url: Optional[str] = None
    associated_patent_id: Optional[int] = None
    # user_id is handled by the backend, not sent by frontend

class SavedInventorResponse(BaseModel):
    id: int
    name: str
    linkedin_url: Optional[str] = None
    associated_patent_id: Optional[int] = None
    user_id: str
    created_at: datetime

class SavedQueryCreate(BaseModel):
    query: str
    # user_id is handled by the backend, not sent by frontend

class SavedQueryResponse(BaseModel):
    id: int
    query: str
    user_id: str
    created_at: datetime

class SavedAlertCreate(BaseModel):
    query: str
    frequency: str  # e.g., "daily", "weekly", "monthly"
    # user_id is handled by the backend, not sent by frontend

class SavedAlertResponse(BaseModel):
    id: int
    query: str
    frequency: str
    user_id: str
    created_at: datetime
