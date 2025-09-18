from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .crew.crew_manager import ImagePromptGenerationCrew, PromptConversionCrew
from .models.schemas import (
    ConvertPromptRequest,
    ConvertPromptResponse,
    GeneratePromptFromImageRequest,
    GeneratePromptRequest,
    GeneratePromptResponse,
)
from .services.provider_config import ProviderConfigurationService

app = FastAPI(
    title="Text-to-Image Prompt Generator API",
    description="AI-powered prompt generation for text-to-image models",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize provider configuration and crew
# Uses LiteLLM (https://docs.litellm.ai/docs/) format. Ensure appropriate API_KEY envars are set in the .env file
provider_configuration = ProviderConfigurationService()
image_prompt_crew = ImagePromptGenerationCrew(provider_service=provider_configuration)
prompt_conversion_crew = PromptConversionCrew(provider_service=provider_configuration)


@app.get("/")
async def root():
    return {"message": "Text-to-Image Prompt Generator API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}


@app.post("/api/generate-prompt", response_model=GeneratePromptResponse)
async def generate_prompt(request: GeneratePromptRequest) -> GeneratePromptResponse:
    print(f"Beginning prompt generation for: {request}")
    return image_prompt_crew.generate_structured_prompt(request)


@app.post("/api/describe-image", response_model=GeneratePromptResponse)
async def describe_image(request: GeneratePromptFromImageRequest) -> GeneratePromptResponse:
    print(f"Beginning image description for: {request.filename or 'uploaded image'}")
    return image_prompt_crew.generate_structured_prompt_from_image(request)


@app.post("/api/convert-prompt", response_model=ConvertPromptResponse)
async def convert_prompt(request: ConvertPromptRequest) -> ConvertPromptResponse:
    print(f"Beginning provider conversion for target {request.target_model}")
    return prompt_conversion_crew.convert_prompt(request)
