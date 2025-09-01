from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class WatchlistItemBase(BaseModel):
    patent_number: str
    notes: Optional[str] = None

class WatchlistItemCreate(WatchlistItemBase):
    user_id: str

class WatchlistItemUpdate(BaseModel):
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class WatchlistItemResponse(WatchlistItemBase):
    id: int
    user_id: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
