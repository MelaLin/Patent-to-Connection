from sqlalchemy import Column, String, DateTime, Integer, Boolean, Text
from sqlalchemy.sql import func
from app.core.database import Base

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    alert_type = Column(String(50), nullable=False)  # 'patent_status', 'new_patent', 'deadline'
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    patent_number = Column(String(20), index=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True))
