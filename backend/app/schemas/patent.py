from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PatentBase(BaseModel):
    patent_number: str
    title: str
    abstract: Optional[str] = None
    inventors: Optional[str] = None
    assignee: Optional[str] = None
    filing_date: Optional[datetime] = None
    publication_date: Optional[datetime] = None
    grant_date: Optional[datetime] = None
    status: Optional[str] = None
    patent_class: Optional[str] = None

class PatentCreate(PatentBase):
    pass

class PatentUpdate(BaseModel):
    title: Optional[str] = None
    abstract: Optional[str] = None
    inventors: Optional[str] = None
    assignee: Optional[str] = None
    filing_date: Optional[datetime] = None
    publication_date: Optional[datetime] = None
    grant_date: Optional[datetime] = None
    status: Optional[str] = None
    patent_class: Optional[str] = None

class PatentResponse(PatentBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
