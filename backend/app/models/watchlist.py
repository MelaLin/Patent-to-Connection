from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class WatchlistItem(Base):
    __tablename__ = "watchlist_items"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    patent_number = Column(String(20), nullable=False, index=True)
    notes = Column(String(1000))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to Patent model
    patent = relationship("Patent", foreign_keys=[patent_number], primaryjoin="WatchlistItem.patent_number == Patent.patent_number")
