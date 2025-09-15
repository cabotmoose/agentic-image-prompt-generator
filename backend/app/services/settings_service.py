from sqlalchemy.orm import Session
from ..models.database import Settings, APIKey, get_db
from ..models.schemas import UpdateSettingsRequest, SettingsInfo, APIKeyInfo
from .encryption import encryption_service
from typing import Dict, List, Optional

class SettingsService:
    """Service for managing application settings and API keys"""
    
    def __init__(self):
        self.supported_providers = ["openai", "anthropic", "google", "stability"]
    
    def get_settings(self, db: Session) -> SettingsInfo:
        """Get current settings with API key status"""
        settings = db.query(Settings).first()
        if not settings:
            # Create default settings
            settings = Settings(default_provider="openai", nsfw_enabled=False)
            db.add(settings)
            db.commit()
            db.refresh(settings)
        
        # Get API key information
        api_keys = db.query(APIKey).filter(APIKey.settings_id == settings.id).all()
        api_key_info = []
        
        for provider in self.supported_providers:
            key_record = next((k for k in api_keys if k.provider == provider), None)
            api_key_info.append(APIKeyInfo(
                provider=provider,
                is_configured=key_record is not None,
                is_active=key_record.is_active if key_record else False
            ))
        
        return SettingsInfo(
            default_provider=settings.default_provider,
            nsfw_enabled=settings.nsfw_enabled,
            api_keys=api_key_info
        )
    
    def update_settings(self, db: Session, request: UpdateSettingsRequest) -> Dict[str, str]:
        """Update application settings"""
        settings = db.query(Settings).first()
        if not settings:
            settings = Settings()
            db.add(settings)
        
        updated_fields = []
        
        # Update provider if specified
        if request.provider and request.provider in self.supported_providers:
            settings.default_provider = request.provider
            updated_fields.append("provider")
        
        # Update NSFW setting if specified
        if request.nsfw_default is not None:
            settings.nsfw_enabled = request.nsfw_default
            updated_fields.append("nsfw_default")
        
        # Update API keys if specified
        if request.api_keys:
            for provider, api_key in request.api_keys.items():
                if provider in self.supported_providers and api_key:
                    self._update_api_key(db, settings.id, provider, api_key)
                    updated_fields.append(f"{provider}_api_key")
        
        db.commit()
        
        return {
            "message": f"Updated: {', '.join(updated_fields)}" if updated_fields else "No changes made",
            "updated_fields": updated_fields
        }
    
    def _update_api_key(self, db: Session, settings_id: int, provider: str, api_key: str):
        """Update or create API key for a provider"""
        # Check if API key already exists
        existing_key = db.query(APIKey).filter(
            APIKey.settings_id == settings_id,
            APIKey.provider == provider
        ).first()
        
        # Encrypt the API key
        encrypted_key = encryption_service.encrypt(api_key)
        
        if existing_key:
            existing_key.encrypted_key = encrypted_key
            existing_key.is_active = True
        else:
            new_key = APIKey(
                settings_id=settings_id,
                provider=provider,
                encrypted_key=encrypted_key,
                is_active=True
            )
            db.add(new_key)
    
    def get_api_key(self, db: Session, provider: str) -> Optional[str]:
        """Get decrypted API key for a provider"""
        settings = db.query(Settings).first()
        if not settings:
            return None
        
        api_key_record = db.query(APIKey).filter(
            APIKey.settings_id == settings.id,
            APIKey.provider == provider,
            APIKey.is_active == True
        ).first()
        
        if not api_key_record:
            return None
        
        return encryption_service.decrypt(api_key_record.encrypted_key)
    
    def get_user_preferences(self, db: Session) -> Dict[str, any]:
        """Get user preferences for prompt generation"""
        settings = db.query(Settings).first()
        if not settings:
            return {
                "provider": "openai",
                "nsfw_enabled": False
            }
        
        return {
            "provider": settings.default_provider,
            "nsfw_enabled": settings.nsfw_enabled
        }
    
    def validate_provider_setup(self, db: Session, provider: str) -> bool:
        """Check if a provider is properly configured with API key"""
        api_key = self.get_api_key(db, provider)
        return api_key is not None and len(api_key.strip()) > 0

# Global settings service instance
settings_service = SettingsService()