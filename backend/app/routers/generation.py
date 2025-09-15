from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..models.database import get_db
from ..models.schemas import GeneratePromptRequest, GeneratePromptResponse
from ..crew.crew_manager import PromptGenerationCrew
from ..services.settings_service import settings_service
from ..services.history_service import history_service
import asyncio
from typing import Dict, Any

router = APIRouter(prefix="/api/generation", tags=["generation"])

# Initialize the crew manager
crew_manager = PromptGenerationCrew()

@router.post("/generate", response_model=GeneratePromptResponse)
async def generate_prompt(
    request: GeneratePromptRequest,
    db: Session = Depends(get_db)
):
    """Generate enhanced prompt using CrewAI agents"""
    try:
        # Validate input
        if not request.prompt or len(request.prompt.strip()) == 0:
            raise HTTPException(status_code=400, detail="Prompt cannot be empty")
        
        if len(request.prompt) > 1000:
            raise HTTPException(status_code=400, detail="Prompt too long (max 1000 characters)")
        
        # Get user preferences
        user_preferences = settings_service.get_user_preferences(db)
        
        # Override with request parameters if provided
        if request.provider:
            user_preferences["provider"] = request.provider
        if request.nsfw_enabled is not None:
            user_preferences["nsfw_enabled"] = request.nsfw_enabled
        
        # Validate provider setup
        provider = user_preferences.get("provider", "openai")
        if not settings_service.validate_provider_setup(db, provider):
            raise HTTPException(
                status_code=400, 
                detail=f"Provider '{provider}' is not configured. Please add API key in settings."
            )
        
        # Generate prompt using crew
        result = await asyncio.to_thread(
            crew_manager.generate_prompt,
            request.prompt,
            user_preferences
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Generation failed"))
        
        # Save to history
        history_service.save_generation(
            db=db,
            original_prompt=request.prompt,
            generated_output=result["data"],
            provider_used=provider,
            processing_time=result["processing_time"]
        )
        
        return GeneratePromptResponse(
            success=True,
            data=result["data"],
            processing_time=result["processing_time"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/providers")
async def get_available_providers(db: Session = Depends(get_db)):
    """Get list of available providers and their configuration status"""
    try:
        settings_info = settings_service.get_settings(db)
        
        providers = []
        for api_key_info in settings_info.api_keys:
            providers.append({
                "name": api_key_info.provider,
                "is_configured": api_key_info.is_configured,
                "is_active": api_key_info.is_active
            })
        
        return {
            "success": True,
            "providers": providers,
            "default_provider": settings_info.default_provider
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get providers: {str(e)}")

@router.get("/recent-prompts")
async def get_recent_prompts(db: Session = Depends(get_db), limit: int = 10):
    """Get recent prompts for suggestions"""
    try:
        if limit > 50:
            limit = 50
        
        recent_prompts = history_service.get_recent_prompts(db, limit)
        
        return {
            "success": True,
            "prompts": recent_prompts
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recent prompts: {str(e)}")

@router.post("/validate-prompt")
async def validate_prompt(request: Dict[str, str]):
    """Validate prompt before generation"""
    try:
        prompt = request.get("prompt", "")
        
        if not prompt or len(prompt.strip()) == 0:
            return {
                "valid": False,
                "error": "Prompt cannot be empty"
            }
        
        if len(prompt) > 1000:
            return {
                "valid": False,
                "error": "Prompt too long (max 1000 characters)"
            }
        
        # Basic content validation
        if len(prompt.strip()) < 3:
            return {
                "valid": False,
                "error": "Prompt too short (min 3 characters)"
            }
        
        return {
            "valid": True,
            "message": "Prompt is valid"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")