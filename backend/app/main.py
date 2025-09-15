from .crew.crew_manager import ImagePromptGenerationCrew
from .models.schemas import GeneratePromptRequest, GeneratePromptResponse
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
llm = LLM(model="openai/gpt-5-mini")
image_prompt_crew = ImagePromptGenerationCrew(llm=llm)

@app.get("/")
async def root():
    return {"message": "Text-to-Image Prompt Generator API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

@app.post("/api/generate", response_model=GeneratePromptResponse)
async def generate_prompt(request: GeneratePromptRequest) -> GeneratePromptResponse:
    print(f"Beginning prompt generation for: {request}")
    return image_prompt_crew.generate_structured_prompt(request)