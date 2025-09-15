from .crew.crew_manager import ImagePromptGenerationCrew
from .models.schemas import GenerateImageResponse, GeneratePromptRequest, GeneratePromptResponse
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from crewai import LLM
from datetime import datetime

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

# Initialize crew
# Uses LiteLLM (https://docs.litellm.ai/docs/) format. Ensure appropriate API_KEY envars are set in the .env file
llm = LLM(model="openai/gpt-4.1-mini")
image_prompt_crew = ImagePromptGenerationCrew(llm=llm)

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

@app.post("/api/generate-image", response_model=GenerateImageResponse)
async def generate_image(request: GeneratedPromptData) -> GenerateImageResponse:
    print(f"Beginning image generation for: {request}")
    return image_prompt_crew.generate_image(request)