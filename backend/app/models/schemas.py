from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# Request schemas
class GeneratePromptRequest(BaseModel):
    prompt: str
    provider: Optional[str] = "openai"
    nsfw_enabled: Optional[bool] = False

class UpdateSettingsRequest(BaseModel):
    provider: Optional[str] = None
    api_keys: Optional[Dict[str, str]] = None
    nsfw_default: Optional[bool] = None

# Response schemas
class CameraSettings(BaseModel):
    angle: str
    lens: str
    framing: str

class Subject(BaseModel):
    mood: str
    body_attributes: str
    age: int
    wardrobe: str
    pose: str

class GeneratedPromptData(BaseModel):
    camera: CameraSettings
    subjects: List[Subject]
    environment: str
    lighting: str
    nsfw: bool

class GeneratePromptResponse(BaseModel):
    success: bool
    data: Optional[GeneratedPromptData] = None
    processing_time: Optional[float] = None
    error: Optional[str] = None

class SettingsResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

class HistoryItem(BaseModel):
    id: int
    original_prompt: str
    generated_output: Dict[str, Any]
    provider_used: str
    processing_time: float
    created_at: datetime

class HistoryResponse(BaseModel):
    success: bool
    data: List[HistoryItem]
    total: int

class APIKeyInfo(BaseModel):
    provider: str
    is_configured: bool
    is_active: bool

class SettingsInfo(BaseModel):
    default_provider: str
    nsfw_enabled: bool
    api_keys: List[APIKeyInfo]