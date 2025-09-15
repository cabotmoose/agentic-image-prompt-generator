from sqlalchemy.orm import Session
from ..models.database import Settings, PromptHistory
from ..models.schemas import HistoryItem, HistoryResponse
from typing import List, Dict, Any
import json

class HistoryService:
    """Service for managing prompt generation history"""
    
    def save_generation(self, db: Session, original_prompt: str, generated_output: Dict[str, Any], 
                       provider_used: str, processing_time: float) -> int:
        """Save a prompt generation to history"""
        settings = db.query(Settings).first()
        if not settings:
            # Create default settings if none exist
            settings = Settings(default_provider="openai", nsfw_enabled=False)
            db.add(settings)
            db.commit()
            db.refresh(settings)
        
        # Create history record
        history_record = PromptHistory(
            settings_id=settings.id,
            original_prompt=original_prompt,
            generated_output=json.dumps(generated_output),
            provider_used=provider_used,
            processing_time=processing_time
        )
        
        db.add(history_record)
        db.commit()
        db.refresh(history_record)
        
        return history_record.id
    
    def get_history(self, db: Session, limit: int = 50, offset: int = 0) -> HistoryResponse:
        """Get prompt generation history with pagination"""
        settings = db.query(Settings).first()
        if not settings:
            return HistoryResponse(success=True, data=[], total=0)
        
        # Get total count
        total = db.query(PromptHistory).filter(
            PromptHistory.settings_id == settings.id
        ).count()
        
        # Get paginated history
        history_records = db.query(PromptHistory).filter(
            PromptHistory.settings_id == settings.id
        ).order_by(PromptHistory.created_at.desc()).offset(offset).limit(limit).all()
        
        # Convert to response format
        history_items = []
        for record in history_records:
            try:
                generated_output = json.loads(record.generated_output)
            except json.JSONDecodeError:
                generated_output = {"error": "Invalid JSON data"}
            
            history_items.append(HistoryItem(
                id=record.id,
                original_prompt=record.original_prompt,
                generated_output=generated_output,
                provider_used=record.provider_used or "unknown",
                processing_time=record.processing_time or 0.0,
                created_at=record.created_at
            ))
        
        return HistoryResponse(
            success=True,
            data=history_items,
            total=total
        )
    
    def get_generation_by_id(self, db: Session, generation_id: int) -> HistoryItem:
        """Get a specific generation by ID"""
        settings = db.query(Settings).first()
        if not settings:
            return None
        
        record = db.query(PromptHistory).filter(
            PromptHistory.id == generation_id,
            PromptHistory.settings_id == settings.id
        ).first()
        
        if not record:
            return None
        
        try:
            generated_output = json.loads(record.generated_output)
        except json.JSONDecodeError:
            generated_output = {"error": "Invalid JSON data"}
        
        return HistoryItem(
            id=record.id,
            original_prompt=record.original_prompt,
            generated_output=generated_output,
            provider_used=record.provider_used or "unknown",
            processing_time=record.processing_time or 0.0,
            created_at=record.created_at
        )
    
    def delete_generation(self, db: Session, generation_id: int) -> bool:
        """Delete a specific generation from history"""
        settings = db.query(Settings).first()
        if not settings:
            return False
        
        record = db.query(PromptHistory).filter(
            PromptHistory.id == generation_id,
            PromptHistory.settings_id == settings.id
        ).first()
        
        if not record:
            return False
        
        db.delete(record)
        db.commit()
        return True
    
    def clear_history(self, db: Session) -> int:
        """Clear all history for the current settings"""
        settings = db.query(Settings).first()
        if not settings:
            return 0
        
        deleted_count = db.query(PromptHistory).filter(
            PromptHistory.settings_id == settings.id
        ).count()
        
        db.query(PromptHistory).filter(
            PromptHistory.settings_id == settings.id
        ).delete()
        
        db.commit()
        return deleted_count
    
    def get_recent_prompts(self, db: Session, limit: int = 10) -> List[str]:
        """Get recent original prompts for suggestions"""
        settings = db.query(Settings).first()
        if not settings:
            return []
        
        records = db.query(PromptHistory.original_prompt).filter(
            PromptHistory.settings_id == settings.id
        ).order_by(PromptHistory.created_at.desc()).limit(limit).all()
        
        return [record.original_prompt for record in records]

# Global history service instance
history_service = HistoryService()