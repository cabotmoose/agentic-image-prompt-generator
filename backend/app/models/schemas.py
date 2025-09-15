from pydantic import BaseModel
from typing import Optional, List

# Request schemas
class GeneratePromptRequest(BaseModel):
    prompt: str
    provider: Optional[str] = "openai"

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

class GenerateImageResponse(BaseModel):
    success: bool
    image_url: Optional[str] = None
    processing_time: Optional[float] = None
    error: Optional[str] = None