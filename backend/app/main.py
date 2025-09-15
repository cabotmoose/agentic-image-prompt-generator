from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from datetime import datetime
import json

from .models.database import get_db, SessionLocal
from .models.models import PromptHistory, Settings
from .services.crew_service import CrewService
from .services.prompt_service import PromptService

app = FastAPI(
    title="Text-to-Image Prompt Generator API",
    description="AI-powered prompt generation for text-to-image models",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API
class PromptRequest(BaseModel):
    input_text: str
    style: Optional[str] = "realistic"
    quality: Optional[str] = "standard"
    nsfw_filter: Optional[bool] = True
    provider: Optional[str] = "openai"

class PromptResponse(BaseModel):
    id: str
    prompt: str
    camera: Optional[str] = None
    subjects: Optional[List[str]] = None
    environment: Optional[str] = None
    lighting: Optional[str] = None
    nsfw: bool = False
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

class SettingsRequest(BaseModel):
    openai_api_key: Optional[str] = None
    google_api_key: Optional[str] = None
    default_style: Optional[str] = None
    default_quality: Optional[str] = None
    nsfw_filter: Optional[bool] = None
    provider: Optional[str] = None

class SettingsResponse(BaseModel):
    openai_api_key: Optional[str] = None
    google_api_key: Optional[str] = None
    default_style: str = "realistic"
    default_quality: str = "standard"
    nsfw_filter: bool = True
    provider: str = "openai"

# Initialize services
crew_service = CrewService()
prompt_service = PromptService()

@app.get("/")
async def root():
    return {"message": "Text-to-Image Prompt Generator API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

@app.post("/api/generate", response_model=PromptResponse)
async def generate_prompt(request: PromptRequest, db: SessionLocal = Depends(get_db)):
    """Generate an enhanced prompt using CrewAI agents"""
    try:
        # Generate prompt using CrewAI
        result = await crew_service.generate_prompt(
            input_text=request.input_text,
            style=request.style,
            quality=request.quality,
            nsfw_filter=request.nsfw_filter,
            provider=request.provider
        )
        
        # Save to database
        prompt_history = PromptHistory(
            input_text=request.input_text,
            generated_prompt=result["prompt"],
            camera=result.get("camera"),
            subjects=json.dumps(result.get("subjects", [])),
            environment=result.get("environment"),
            lighting=result.get("lighting"),
            nsfw=result.get("nsfw", False),
            metadata=json.dumps(result.get("metadata", {})),
            style=request.style,
            quality=request.quality,
            provider=request.provider
        )
        
        db.add(prompt_history)
        db.commit()
        db.refresh(prompt_history)
        
        return PromptResponse(
            id=str(prompt_history.id),
            prompt=result["prompt"],
            camera=result.get("camera"),
            subjects=result.get("subjects", []),
            environment=result.get("environment"),
            lighting=result.get("lighting"),
            nsfw=result.get("nsfw", False),
            metadata=result.get("metadata", {}),
            created_at=prompt_history.created_at
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating prompt: {str(e)}")

@app.get("/api/history", response_model=List[PromptResponse])
async def get_history(limit: int = 10, db: SessionLocal = Depends(get_db)):
    """Get prompt generation history"""
    try:
        history = db.query(PromptHistory).order_by(PromptHistory.created_at.desc()).limit(limit).all()
        
        return [
            PromptResponse(
                id=str(item.id),
                prompt=item.generated_prompt,
                camera=item.camera,
                subjects=json.loads(item.subjects) if item.subjects else [],
                environment=item.environment,
                lighting=item.lighting,
                nsfw=item.nsfw,
                metadata=json.loads(item.metadata) if item.metadata else {},
                created_at=item.created_at
            )
            for item in history
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")

@app.delete("/api/history/{prompt_id}")
async def delete_history_item(prompt_id: str, db: SessionLocal = Depends(get_db)):
    """Delete a specific history item"""
    try:
        item = db.query(PromptHistory).filter(PromptHistory.id == int(prompt_id)).first()
        if not item:
            raise HTTPException(status_code=404, detail="History item not found")
        
        db.delete(item)
        db.commit()
        
        return {"message": "History item deleted successfully"}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid prompt ID")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting history item: {str(e)}")

@app.get("/api/settings", response_model=SettingsResponse)
async def get_settings(db: SessionLocal = Depends(get_db)):
    """Get application settings"""
    try:
        settings = db.query(Settings).first()
        if not settings:
            # Create default settings
            settings = Settings()
            db.add(settings)
            db.commit()
            db.refresh(settings)
        
        return SettingsResponse(
            openai_api_key="***" if settings.openai_api_key else None,
            google_api_key="***" if settings.google_api_key else None,
            default_style=settings.default_style,
            default_quality=settings.default_quality,
            nsfw_filter=settings.nsfw_filter,
            provider=settings.provider
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching settings: {str(e)}")

@app.post("/api/settings", response_model=SettingsResponse)
async def update_settings(request: SettingsRequest, db: SessionLocal = Depends(get_db)):
    """Update application settings"""
    try:
        settings = db.query(Settings).first()
        if not settings:
            settings = Settings()
            db.add(settings)
        
        # Update only provided fields
        if request.openai_api_key is not None:
            settings.openai_api_key = request.openai_api_key
        if request.google_api_key is not None:
            settings.google_api_key = request.google_api_key
        if request.default_style is not None:
            settings.default_style = request.default_style
        if request.default_quality is not None:
            settings.default_quality = request.default_quality
        if request.nsfw_filter is not None:
            settings.nsfw_filter = request.nsfw_filter
        if request.provider is not None:
            settings.provider = request.provider
        
        db.commit()
        db.refresh(settings)
        
        return SettingsResponse(
            openai_api_key="***" if settings.openai_api_key else None,
            google_api_key="***" if settings.google_api_key else None,
            default_style=settings.default_style,
            default_quality=settings.default_quality,
            nsfw_filter=settings.nsfw_filter,
            provider=settings.provider
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating settings: {str(e)}")

@app.post("/api/test-connection")
async def test_api_connection(provider: str = "openai", db: SessionLocal = Depends(get_db)):
    """Test API connection for the specified provider"""
    try:
        settings = db.query(Settings).first()
        if not settings:
            raise HTTPException(status_code=400, detail="No settings found. Please configure API keys first.")
        
        success = await crew_service.test_connection(provider, settings)
        
        if success:
            return {"status": "success", "message": f"{provider.title()} API connection successful"}
        else:
            return {"status": "error", "message": f"{provider.title()} API connection failed"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error testing connection: {str(e)}")

@app.delete("/api/settings/api-key/{provider}")
async def delete_api_key(provider: str, db: SessionLocal = Depends(get_db)):
    """Delete API key for the specified provider"""
    try:
        settings = db.query(Settings).first()
        if not settings:
            raise HTTPException(status_code=404, detail="Settings not found")
        
        if provider == "openai":
            settings.openai_api_key = None
        elif provider == "google":
            settings.google_api_key = None
        else:
            raise HTTPException(status_code=400, detail="Invalid provider")
        
        db.commit()
        
        return {"message": f"{provider.title()} API key deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting API key: {str(e)}")

@app.post("/api/settings/reset")
async def reset_settings(db: SessionLocal = Depends(get_db)):
    """Reset all settings to defaults"""
    try:
        settings = db.query(Settings).first()
        if settings:
            db.delete(settings)
            db.commit()
        
        # Create new default settings
        new_settings = Settings()
        db.add(new_settings)
        db.commit()
        db.refresh(new_settings)
        
        return {"message": "Settings reset to defaults successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resetting settings: {str(e)}")