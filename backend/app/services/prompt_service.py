from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..models.models import PromptHistory, Settings
from ..models.database import get_db
from .crew_service import CrewService

class PromptService:
    """Service for managing prompt generation and history"""
    
    def __init__(self):
        self.crew_service = CrewService()
    
    async def generate_prompt(self, db: Session, input_text: str, 
                            style: str = "realistic", quality: str = "standard", 
                            nsfw_filter: bool = True, provider: str = "openai") -> Dict[str, Any]:
        """Generate enhanced prompt and save to history"""
        
        try:
            # Generate prompt using CrewAI
            result = await self.crew_service.generate_prompt(
                input_text=input_text,
                style=style,
                quality=quality,
                nsfw_filter=nsfw_filter,
                provider=provider
            )
            
            # Save to history
            history_entry = PromptHistory(
                input_text=input_text,
                enhanced_prompt=result.get("prompt", ""),
                style=style,
                quality=quality,
                provider=provider,
                camera_info=result.get("camera", ""),
                subjects=str(result.get("subjects", [])),
                environment=result.get("environment", ""),
                lighting=result.get("lighting", ""),
                nsfw_detected=result.get("nsfw", False),
                metadata=str(result.get("metadata", {})),
                created_at=datetime.now()
            )
            
            db.add(history_entry)
            db.commit()
            db.refresh(history_entry)
            
            # Add history ID to result
            result["history_id"] = history_entry.id
            
            return result
            
        except Exception as e:
            db.rollback()
            raise Exception(f"Error generating prompt: {str(e)}")
    
    def get_history(self, db: Session, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Get prompt generation history"""
        
        try:
            history_entries = db.query(PromptHistory)\
                               .order_by(desc(PromptHistory.created_at))\
                               .offset(offset)\
                               .limit(limit)\
                               .all()
            
            return [
                {
                    "id": entry.id,
                    "input_text": entry.input_text,
                    "enhanced_prompt": entry.enhanced_prompt,
                    "style": entry.style,
                    "quality": entry.quality,
                    "provider": entry.provider,
                    "camera_info": entry.camera_info,
                    "subjects": self._parse_subjects(entry.subjects),
                    "environment": entry.environment,
                    "lighting": entry.lighting,
                    "nsfw_detected": entry.nsfw_detected,
                    "metadata": self._parse_metadata(entry.metadata),
                    "created_at": entry.created_at.isoformat() if entry.created_at else None
                }
                for entry in history_entries
            ]
            
        except Exception as e:
            raise Exception(f"Error retrieving history: {str(e)}")
    
    def get_history_item(self, db: Session, history_id: int) -> Optional[Dict[str, Any]]:
        """Get specific history item by ID"""
        
        try:
            entry = db.query(PromptHistory).filter(PromptHistory.id == history_id).first()
            
            if not entry:
                return None
            
            return {
                "id": entry.id,
                "input_text": entry.input_text,
                "enhanced_prompt": entry.enhanced_prompt,
                "style": entry.style,
                "quality": entry.quality,
                "provider": entry.provider,
                "camera_info": entry.camera_info,
                "subjects": self._parse_subjects(entry.subjects),
                "environment": entry.environment,
                "lighting": entry.lighting,
                "nsfw_detected": entry.nsfw_detected,
                "metadata": self._parse_metadata(entry.metadata),
                "created_at": entry.created_at.isoformat() if entry.created_at else None
            }
            
        except Exception as e:
            raise Exception(f"Error retrieving history item: {str(e)}")
    
    def delete_history_item(self, db: Session, history_id: int) -> bool:
        """Delete specific history item"""
        
        try:
            entry = db.query(PromptHistory).filter(PromptHistory.id == history_id).first()
            
            if not entry:
                return False
            
            db.delete(entry)
            db.commit()
            return True
            
        except Exception as e:
            db.rollback()
            raise Exception(f"Error deleting history item: {str(e)}")
    
    def clear_history(self, db: Session) -> int:
        """Clear all history entries"""
        
        try:
            count = db.query(PromptHistory).count()
            db.query(PromptHistory).delete()
            db.commit()
            return count
            
        except Exception as e:
            db.rollback()
            raise Exception(f"Error clearing history: {str(e)}")
    
    def get_settings(self, db: Session) -> Dict[str, Any]:
        """Get application settings"""
        
        try:
            settings = db.query(Settings).first()
            
            if not settings:
                # Create default settings
                settings = Settings(
                    openai_api_key="",
                    google_api_key="",
                    default_provider="openai",
                    default_style="realistic",
                    default_quality="standard",
                    nsfw_filter=True,
                    max_history_items=100,
                    auto_save_prompts=True
                )
                db.add(settings)
                db.commit()
                db.refresh(settings)
            
            return {
                "id": settings.id,
                "openai_api_key": self._mask_api_key(settings.openai_api_key),
                "google_api_key": self._mask_api_key(settings.google_api_key),
                "default_provider": settings.default_provider,
                "default_style": settings.default_style,
                "default_quality": settings.default_quality,
                "nsfw_filter": settings.nsfw_filter,
                "max_history_items": settings.max_history_items,
                "auto_save_prompts": settings.auto_save_prompts,
                "updated_at": settings.updated_at.isoformat() if settings.updated_at else None
            }
            
        except Exception as e:
            raise Exception(f"Error retrieving settings: {str(e)}")
    
    def update_settings(self, db: Session, settings_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update application settings"""
        
        try:
            settings = db.query(Settings).first()
            
            if not settings:
                settings = Settings()
                db.add(settings)
            
            # Update fields if provided
            if "openai_api_key" in settings_data:
                settings.openai_api_key = settings_data["openai_api_key"]
            
            if "google_api_key" in settings_data:
                settings.google_api_key = settings_data["google_api_key"]
            
            if "default_provider" in settings_data:
                settings.default_provider = settings_data["default_provider"]
            
            if "default_style" in settings_data:
                settings.default_style = settings_data["default_style"]
            
            if "default_quality" in settings_data:
                settings.default_quality = settings_data["default_quality"]
            
            if "nsfw_filter" in settings_data:
                settings.nsfw_filter = settings_data["nsfw_filter"]
            
            if "max_history_items" in settings_data:
                settings.max_history_items = settings_data["max_history_items"]
            
            if "auto_save_prompts" in settings_data:
                settings.auto_save_prompts = settings_data["auto_save_prompts"]
            
            settings.updated_at = datetime.now()
            
            db.commit()
            db.refresh(settings)
            
            return {
                "id": settings.id,
                "openai_api_key": self._mask_api_key(settings.openai_api_key),
                "google_api_key": self._mask_api_key(settings.google_api_key),
                "default_provider": settings.default_provider,
                "default_style": settings.default_style,
                "default_quality": settings.default_quality,
                "nsfw_filter": settings.nsfw_filter,
                "max_history_items": settings.max_history_items,
                "auto_save_prompts": settings.auto_save_prompts,
                "updated_at": settings.updated_at.isoformat() if settings.updated_at else None
            }
            
        except Exception as e:
            db.rollback()
            raise Exception(f"Error updating settings: {str(e)}")
    
    def reset_settings(self, db: Session) -> Dict[str, Any]:
        """Reset settings to defaults"""
        
        try:
            # Delete existing settings
            db.query(Settings).delete()
            
            # Create new default settings
            settings = Settings(
                openai_api_key="",
                google_api_key="",
                default_provider="openai",
                default_style="realistic",
                default_quality="standard",
                nsfw_filter=True,
                max_history_items=100,
                auto_save_prompts=True
            )
            
            db.add(settings)
            db.commit()
            db.refresh(settings)
            
            return {
                "id": settings.id,
                "openai_api_key": self._mask_api_key(settings.openai_api_key),
                "google_api_key": self._mask_api_key(settings.google_api_key),
                "default_provider": settings.default_provider,
                "default_style": settings.default_style,
                "default_quality": settings.default_quality,
                "nsfw_filter": settings.nsfw_filter,
                "max_history_items": settings.max_history_items,
                "auto_save_prompts": settings.auto_save_prompts,
                "updated_at": settings.updated_at.isoformat() if settings.updated_at else None
            }
            
        except Exception as e:
            db.rollback()
            raise Exception(f"Error resetting settings: {str(e)}")
    
    async def test_api_connection(self, db: Session, provider: str) -> bool:
        """Test API connection for specified provider"""
        
        try:
            settings = db.query(Settings).first()
            
            if not settings:
                return False
            
            return await self.crew_service.test_connection(provider, settings)
            
        except Exception as e:
            print(f"API connection test failed: {e}")
            return False
    
    def delete_api_key(self, db: Session, provider: str) -> bool:
        """Delete API key for specified provider"""
        
        try:
            settings = db.query(Settings).first()
            
            if not settings:
                return False
            
            if provider == "openai":
                settings.openai_api_key = ""
            elif provider == "google":
                settings.google_api_key = ""
            else:
                return False
            
            settings.updated_at = datetime.now()
            db.commit()
            
            return True
            
        except Exception as e:
            db.rollback()
            raise Exception(f"Error deleting API key: {str(e)}")
    
    def _mask_api_key(self, api_key: str) -> str:
        """Mask API key for security"""
        if not api_key or len(api_key) < 8:
            return ""
        
        return api_key[:4] + "*" * (len(api_key) - 8) + api_key[-4:]
    
    def _parse_subjects(self, subjects_str: str) -> List[str]:
        """Parse subjects string back to list"""
        try:
            import ast
            return ast.literal_eval(subjects_str) if subjects_str else []
        except:
            return subjects_str.split(",") if subjects_str else []
    
    def _parse_metadata(self, metadata_str: str) -> Dict[str, Any]:
        """Parse metadata string back to dict"""
        try:
            import ast
            return ast.literal_eval(metadata_str) if metadata_str else {}
        except:
            return {}
    
    def get_statistics(self, db: Session) -> Dict[str, Any]:
        """Get usage statistics"""
        
        try:
            total_prompts = db.query(PromptHistory).count()
            
            # Get style distribution
            style_stats = db.query(PromptHistory.style, db.func.count(PromptHistory.style))\
                           .group_by(PromptHistory.style)\
                           .all()
            
            # Get provider distribution
            provider_stats = db.query(PromptHistory.provider, db.func.count(PromptHistory.provider))\
                              .group_by(PromptHistory.provider)\
                              .all()
            
            # Get recent activity (last 7 days)
            from datetime import timedelta
            week_ago = datetime.now() - timedelta(days=7)
            recent_prompts = db.query(PromptHistory)\
                             .filter(PromptHistory.created_at >= week_ago)\
                             .count()
            
            return {
                "total_prompts": total_prompts,
                "recent_prompts": recent_prompts,
                "style_distribution": dict(style_stats),
                "provider_distribution": dict(provider_stats)
            }
            
        except Exception as e:
            raise Exception(f"Error retrieving statistics: {str(e)}")