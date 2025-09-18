from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


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
class PromptTexts(BaseModel):
    primary: str = ""
    negative: Optional[str] = None


class CameraSettings(BaseModel):
    angle: Optional[str] = None
    lens: Optional[str] = None
    framing: Optional[str] = None
    depth_of_field: Optional[str] = None


class Composition(BaseModel):
    camera: CameraSettings = Field(default_factory=CameraSettings)
    shot: Optional[str] = None
    aspect_ratio: Optional[str] = None


class Subject(BaseModel):
    role: Optional[str] = None
    age: Optional[str] = None
    body_attributes: Optional[str] = None
    wardrobe: Optional[str] = None
    pose: Optional[str] = None
    mood: Optional[str] = None


class StyleSettings(BaseModel):
    keywords: List[str] = Field(default_factory=list)
    medium: Optional[str] = None
    aesthetic_bias: List[str] = Field(default_factory=list)


class ColorSettings(BaseModel):
    palette: Optional[str] = None
    dominant_colors: List[str] = Field(default_factory=list)


class ImagePromptControl(BaseModel):
    uri: str
    weight: Optional[float] = None
    type: Optional[str] = None


class ControlNetConfig(BaseModel):
    type: str
    image_uri: str
    weight: Optional[float] = None
    start: Optional[float] = None
    end: Optional[float] = None


class LoraConfig(BaseModel):
    name: str
    weight: Optional[float] = None


class PromptControls(BaseModel):
    image_prompts: List[ImagePromptControl] = Field(default_factory=list)
    control_nets: List[ControlNetConfig] = Field(default_factory=list)
    loras: List[LoraConfig] = Field(default_factory=list)


class GenerationParams(BaseModel):
    width: Optional[int] = None
    height: Optional[int] = None
    steps: Optional[int] = None
    guidance: Optional[float] = None
    sampler: Optional[str] = None
    seed: Optional[int] = None
    images: Optional[int] = None


class UpscaleSettings(BaseModel):
    mode: Optional[str] = None
    strength: Optional[float] = None


class PostProcessingSettings(BaseModel):
    upscale: UpscaleSettings = Field(default_factory=UpscaleSettings)
    face_restore: Optional[bool] = None


class SafetySettings(BaseModel):
    allow_nsfw: Optional[bool] = None


class GeneratedPromptData(BaseModel):
    version: str = "1.0"
    intent: Optional[str] = None
    prompt: PromptTexts = Field(default_factory=PromptTexts)
    subjects: List[Subject] = Field(default_factory=list)
    environment: Optional[str] = None
    composition: Composition = Field(default_factory=Composition)
    lighting: Optional[str] = None
    style: StyleSettings = Field(default_factory=StyleSettings)
    color: ColorSettings = Field(default_factory=ColorSettings)
    controls: PromptControls = Field(default_factory=PromptControls)
    params: GenerationParams = Field(default_factory=GenerationParams)
    post: PostProcessingSettings = Field(default_factory=PostProcessingSettings)
    safety: SafetySettings = Field(default_factory=SafetySettings)
    provider_overrides: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    notes: Optional[str] = None


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
