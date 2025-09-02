from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean, Date, ARRAY
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

Base = declarative_base()

class SavedPatent(Base):
    __tablename__ = "saved_patents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    abstract = Column(Text, nullable=False)
    assignee = Column(String, nullable=False)
    inventors = Column(JSON, nullable=False)  # Store as JSON array
    link = Column(String, nullable=True)
    date_filed = Column(DateTime(timezone=True), nullable=True)
    user_id = Column(String, nullable=False, index=True)  # For user scoping
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to saved inventors
    saved_inventors = relationship("SavedInventor", back_populates="patent")

class SavedInventor(Base):
    __tablename__ = "saved_inventors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    linkedin_url = Column(String, nullable=True)
    associated_patent_id = Column(Integer, ForeignKey("saved_patents.id"), nullable=True)
    user_id = Column(String, nullable=False, index=True)  # For user scoping
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to saved patent
    patent = relationship("SavedPatent", back_populates="saved_inventors")

class SavedQuery(Base):
    __tablename__ = "saved_queries"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(Text, nullable=False)
    user_id = Column(String, nullable=False, index=True)  # For user scoping
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SavedAlert(Base):
    __tablename__ = "saved_alerts"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(Text, nullable=False)
    frequency = Column(String, nullable=False)  # e.g., "daily", "weekly", "monthly"
    user_id = Column(String, nullable=False, index=True)  # For user scoping
    created_at = Column(DateTime(timezone=True), server_default=func.now())
