from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# Request schemas
class GeneratePromptRequest(BaseModel):
    prompt: str
    provider: Optional[str] = "openai"
    provider_api_keys: Optional[Dict[str, str]] = None


class GeneratePromptFromImageRequest(BaseModel):
    image_base64: str
    filename: Optional[str] = None
    provider: Optional[str] = "openai"
    provider_api_keys: Optional[Dict[str, str]] = None

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
    subjects: Optional[List[Subject]] = None
    style: str
    environment: str
    lighting: str

class GeneratePromptResponse(BaseModel):
    success: bool
    data: Optional[GeneratedPromptData] = None
    processing_time: Optional[float] = None
    error: Optional[str] = None
    token_usage: Optional[Any] = None

class GenerateImageResponse(BaseModel):
    success: bool
    image_url: Optional[str] = None
    processing_time: Optional[float] = None
    error: Optional[str] = None
