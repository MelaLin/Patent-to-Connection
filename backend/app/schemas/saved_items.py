from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

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
