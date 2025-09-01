from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlertBase(BaseModel):
    alert_type: str
    title: str
    message: str
    patent_number: Optional[str] = None

class AlertCreate(AlertBase):
    user_id: str

class AlertUpdate(BaseModel):
    is_read: Optional[bool] = None

class AlertResponse(AlertBase):
    id: int
    user_id: str
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
