from sqlalchemy import Column, String, DateTime, Text, Integer, Boolean
from sqlalchemy.sql import func
from app.core.database import Base

class Patent(Base):
    __tablename__ = "patents"
    
    id = Column(Integer, primary_key=True, index=True)
    patent_number = Column(String(20), unique=True, index=True, nullable=False)
    title = Column(String(500), nullable=False)
    abstract = Column(Text)
    inventors = Column(Text)
    assignee = Column(String(500))
    filing_date = Column(DateTime)
    publication_date = Column(DateTime)
    grant_date = Column(DateTime)
    status = Column(String(50))
    patent_class = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
