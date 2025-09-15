from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..models.database import get_db
from ..models.schemas import UpdateSettingsRequest, SettingsResponse
from ..services.settings_service import settings_service
from typing import Dict, Any

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("/")
async def get_settings(db: Session = Depends(get_db)):
    """Get current application settings"""
    try:
        settings_info = settings_service.get_settings(db)
        
        return {
            "success": True,
            "data": {
                "default_provider": settings_info.default_provider,
                "nsfw_enabled": settings_info.nsfw_enabled,
                "api_keys": [
                    {
                        "provider": key.provider,
                        "is_configured": key.is_configured,
                        "is_active": key.is_active
                    }
                    for key in settings_info.api_keys
                ]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get settings: {str(e)}")

@router.put("/", response_model=SettingsResponse)
async def update_settings(
    request: UpdateSettingsRequest,
    db: Session = Depends(get_db)
):
    """Update application settings"""
    try:
        # Validate provider if specified
        if request.provider and request.provider not in ["openai", "anthropic", "google", "stability"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported provider: {request.provider}"
            )
        
        # Validate API keys if provided
        if request.api_keys:
            for provider, api_key in request.api_keys.items():
                if provider not in ["openai", "anthropic", "google", "stability"]:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Unsupported provider: {provider}"
                    )
                
                if not api_key or len(api_key.strip()) == 0:
                    raise HTTPException(
                        status_code=400,
                        detail=f"API key for {provider} cannot be empty"
                    )
                
                if len(api_key) > 500:
                    raise HTTPException(
                        status_code=400,
                        detail=f"API key for {provider} is too long"
                    )
        
        # Update settings
        result = settings_service.update_settings(db, request)
        
        return SettingsResponse(
            success=True,
            message=result["message"],
            data={
                "updated_fields": result["updated_fields"]
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update settings: {str(e)}")

@router.post("/test-provider")
async def test_provider(
    request: Dict[str, str],
    db: Session = Depends(get_db)
):
    """Test if a provider is properly configured"""
    try:
        provider = request.get("provider")
        if not provider:
            raise HTTPException(status_code=400, detail="Provider is required")
        
        if provider not in ["openai", "anthropic", "google", "stability"]:
            raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")
        
        is_configured = settings_service.validate_provider_setup(db, provider)
        
        return {
            "success": True,
            "provider": provider,
            "is_configured": is_configured,
            "message": f"Provider {provider} is {'configured' if is_configured else 'not configured'}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to test provider: {str(e)}")

@router.get("/providers")
async def get_supported_providers():
    """Get list of supported providers"""
    try:
        providers = [
            {
                "name": "openai",
                "display_name": "OpenAI",
                "description": "GPT models for text generation",
                "requires_api_key": True
            },
            {
                "name": "anthropic",
                "display_name": "Anthropic",
                "description": "Claude models for text generation",
                "requires_api_key": True
            },
            {
                "name": "google",
                "display_name": "Google AI",
                "description": "Gemini models for text generation",
                "requires_api_key": True
            },
            {
                "name": "stability",
                "display_name": "Stability AI",
                "description": "Stable Diffusion models",
                "requires_api_key": True
            }
        ]
        
        return {
            "success": True,
            "providers": providers
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get providers: {str(e)}")

@router.delete("/api-key/{provider}")
async def delete_api_key(
    provider: str,
    db: Session = Depends(get_db)
):
    """Delete API key for a specific provider"""
    try:
        if provider not in ["openai", "anthropic", "google", "stability"]:
            raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")
        
        # This would require implementing a delete method in settings_service
        # For now, we'll return a placeholder response
        return {
            "success": True,
            "message": f"API key for {provider} would be deleted",
            "provider": provider
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete API key: {str(e)}")

@router.post("/reset")
async def reset_settings(db: Session = Depends(get_db)):
    """Reset settings to default values"""
    try:
        # Reset to default settings
        default_request = UpdateSettingsRequest(
            provider="openai",
            nsfw_default=False
        )
        
        result = settings_service.update_settings(db, default_request)
        
        return {
            "success": True,
            "message": "Settings reset to default values",
            "data": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset settings: {str(e)}")