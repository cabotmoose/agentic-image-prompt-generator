from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from .database import Base

class PromptHistory(Base):
    """Model for storing prompt generation history"""
    __tablename__ = "prompt_history"
    
    id = Column(Integer, primary_key=True, index=True)
    input_text = Column(Text, nullable=False)
    generated_prompt = Column(Text, nullable=False)
    camera = Column(String(255), nullable=True)
    subjects = Column(Text, nullable=True)  # JSON string of subjects list
    environment = Column(String(500), nullable=True)
    lighting = Column(String(255), nullable=True)
    nsfw = Column(Boolean, default=False)
    prompt_metadata = Column(Text, nullable=True)  # JSON string for additional metadata
    style = Column(String(100), default="realistic")
    quality = Column(String(100), default="standard")
    provider = Column(String(50), default="openai")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Settings(Base):
    """Model for storing application settings"""
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, index=True)
    openai_api_key = Column(String(255), nullable=True)
    google_api_key = Column(String(255), nullable=True)
    default_style = Column(String(100), default="realistic")
    default_quality = Column(String(100), default="standard")
    nsfw_filter = Column(Boolean, default=True)
    provider = Column(String(50), default="openai")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())