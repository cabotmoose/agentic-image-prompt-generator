import os
import json
import re
from typing import Dict, Any, Optional, List
from datetime import datetime

try:
    from crewai import Agent, Task, Crew, Process
    from crewai.tools import BaseTool
    CREWAI_AVAILABLE = True
except ImportError:
    CREWAI_AVAILABLE = False
    print("CrewAI not available, using fallback implementation")

class CrewService:
    """Service for managing CrewAI agents and prompt generation"""
    
    def __init__(self):
        self.agents_initialized = False
        self.crew = None
        
        if CREWAI_AVAILABLE:
            self._initialize_agents()
    
    def _initialize_agents(self):
        """Initialize the three CrewAI agents"""
        try:
            # Initial Prompt Drafter Agent
            self.initial_drafter = Agent(
                role="Initial Prompt Drafter",
                goal="Transform user input into a structured, detailed text-to-image prompt with technical specifications",
                backstory="""You are an expert in text-to-image generation with deep knowledge of prompt engineering. 
                You specialize in converting simple user descriptions into detailed, structured prompts that include 
                camera settings, subject details, environment descriptions, and lighting conditions. You understand 
                how different elements affect image generation quality and composition.""",
                verbose=True,
                allow_delegation=False
            )
            
            # Technical Editor Agent
            self.technical_editor = Agent(
                role="Technical Editor",
                goal="Enhance prompts with precise technical photography and artistic terminology",
                backstory="""You are a professional photographer and digital artist with expertise in camera technology, 
                lighting techniques, and artistic composition. You excel at adding technical precision to prompts, 
                ensuring they include proper camera settings, lens specifications, lighting setups, and artistic 
                style references that will produce high-quality, professional-looking images.""",
                verbose=True,
                allow_delegation=False
            )
            
            # Supervising Editor Agent
            self.supervising_editor = Agent(
                role="Supervising Editor",
                goal="Finalize prompts ensuring they meet quality standards and output format requirements",
                backstory="""You are a senior creative director with extensive experience in AI image generation 
                and prompt optimization. Your role is to review and finalize prompts, ensuring they are 
                well-structured, technically accurate, and formatted correctly. You also apply content 
                filtering and ensure the output meets the specified JSON format requirements.""",
                verbose=True,
                allow_delegation=False
            )
            
            self.agents_initialized = True
            print("CrewAI agents initialized successfully")
            
        except Exception as e:
            print(f"Error initializing CrewAI agents: {e}")
            self.agents_initialized = False
    
    async def generate_prompt(self, input_text: str, style: str = "realistic", 
                            quality: str = "standard", nsfw_filter: bool = True, 
                            provider: str = "openai") -> Dict[str, Any]:
        """Generate enhanced prompt using CrewAI agents"""
        
        if not CREWAI_AVAILABLE or not self.agents_initialized:
            return await self._fallback_generation(input_text, style, quality, nsfw_filter)
        
        try:
            # Set up environment variables for API keys
            await self._setup_api_keys(provider)
            
            # Create tasks for each agent
            draft_task = Task(
                description=f"""Transform the user input '{input_text}' into a detailed text-to-image prompt.
                Style preference: {style}
                Quality level: {quality}
                
                Create a comprehensive prompt that includes:
                - Detailed subject description
                - Camera and lens specifications
                - Lighting conditions
                - Environment and background details
                - Artistic style elements
                
                Focus on creating a prompt that will generate a {style} image with {quality} quality.""",
                agent=self.initial_drafter,
                expected_output="A detailed text-to-image prompt with technical specifications"
            )
            
            technical_task = Task(
                description="""Enhance the initial prompt with precise technical photography terminology.
                Add specific:
                - Camera settings (aperture, focal length, ISO)
                - Professional lighting setup details
                - Lens characteristics and effects
                - Color grading and post-processing terms
                - Professional photography techniques
                
                Ensure the prompt uses industry-standard terminology that will produce professional results.""",
                agent=self.technical_editor,
                expected_output="A technically enhanced prompt with professional photography specifications"
            )
            
            supervising_task = Task(
                description=f"""Finalize the prompt and format the output as a JSON object with these exact fields:
                {{
                    "prompt": "final enhanced prompt text",
                    "camera": "camera and lens specifications",
                    "subjects": ["list", "of", "main", "subjects"],
                    "environment": "environment and background description",
                    "lighting": "lighting setup and conditions",
                    "nsfw": false,
                    "metadata": {{
                        "style": "{style}",
                        "quality": "{quality}",
                        "provider": "{provider}",
                        "generated_at": "{datetime.now().isoformat()}"
                    }}
                }}
                
                Apply content filtering if nsfw_filter is {nsfw_filter}.
                Ensure the prompt is optimized for {provider} image generation.
                Return ONLY the JSON object, no additional text.""",
                agent=self.supervising_editor,
                expected_output="A properly formatted JSON object with all required fields"
            )
            
            # Create and run the crew
            crew = Crew(
                agents=[self.initial_drafter, self.technical_editor, self.supervising_editor],
                tasks=[draft_task, technical_task, supervising_task],
                process=Process.sequential,
                verbose=True
            )
            
            result = crew.kickoff()
            
            # Parse the result
            return self._parse_crew_result(result, input_text, style, quality, provider)
            
        except Exception as e:
            print(f"Error in CrewAI generation: {e}")
            return await self._fallback_generation(input_text, style, quality, nsfw_filter)
    
    def _parse_crew_result(self, result: str, input_text: str, style: str, quality: str, provider: str) -> Dict[str, Any]:
        """Parse the CrewAI result and extract JSON"""
        try:
            # Try to extract JSON from the result
            json_match = re.search(r'\{.*\}', str(result), re.DOTALL)
            if json_match:
                json_str = json_match.group()
                parsed_result = json.loads(json_str)
                
                # Validate required fields
                required_fields = ['prompt', 'camera', 'subjects', 'environment', 'lighting', 'nsfw']
                for field in required_fields:
                    if field not in parsed_result:
                        parsed_result[field] = self._get_default_value(field)
                
                return parsed_result
            else:
                raise ValueError("No JSON found in result")
                
        except Exception as e:
            print(f"Error parsing CrewAI result: {e}")
            # Return fallback result
            return self._create_fallback_result(input_text, style, quality, provider)
    
    async def _fallback_generation(self, input_text: str, style: str, quality: str, nsfw_filter: bool) -> Dict[str, Any]:
        """Fallback prompt generation when CrewAI is not available"""
        
        # Enhanced prompt generation logic
        enhanced_prompt = self._enhance_prompt_fallback(input_text, style, quality)
        
        # Extract components
        camera = self._extract_camera_info(style, quality)
        subjects = self._extract_subjects(input_text)
        environment = self._extract_environment(input_text, style)
        lighting = self._extract_lighting(style)
        
        return {
            "prompt": enhanced_prompt,
            "camera": camera,
            "subjects": subjects,
            "environment": environment,
            "lighting": lighting,
            "nsfw": False if nsfw_filter else self._check_nsfw_content(input_text),
            "metadata": {
                "style": style,
                "quality": quality,
                "provider": "fallback",
                "generated_at": datetime.now().isoformat()
            }
        }
    
    def _enhance_prompt_fallback(self, input_text: str, style: str, quality: str) -> str:
        """Enhanced prompt generation using rule-based approach"""
        
        # Style-specific enhancements
        style_modifiers = {
            "realistic": "photorealistic, highly detailed, sharp focus, professional photography",
            "artistic": "artistic interpretation, creative composition, expressive style",
            "cinematic": "cinematic lighting, dramatic composition, film-like quality",
            "fantasy": "fantasy art style, magical atmosphere, ethereal lighting",
            "anime": "anime style, vibrant colors, detailed character design"
        }
        
        # Quality-specific enhancements
        quality_modifiers = {
            "standard": "good quality, clear details",
            "high": "high quality, ultra detailed, 4K resolution, professional grade",
            "ultra": "ultra high quality, 8K resolution, masterpiece, award-winning"
        }
        
        # Camera and technical specifications
        camera_specs = {
            "realistic": "shot with DSLR camera, 85mm lens, f/1.8 aperture",
            "artistic": "creative camera angle, artistic composition",
            "cinematic": "cinematic camera work, professional cinematography",
            "fantasy": "magical perspective, otherworldly view",
            "anime": "anime-style perspective, dynamic angle"
        }
        
        # Lighting specifications
        lighting_specs = {
            "realistic": "natural lighting, soft shadows, balanced exposure",
            "artistic": "creative lighting, artistic shadows",
            "cinematic": "dramatic lighting, cinematic shadows, mood lighting",
            "fantasy": "magical lighting, ethereal glow, mystical atmosphere",
            "anime": "anime-style lighting, vibrant illumination"
        }
        
        # Build enhanced prompt
        enhanced_parts = [
            input_text,
            style_modifiers.get(style, style_modifiers["realistic"]),
            quality_modifiers.get(quality, quality_modifiers["standard"]),
            camera_specs.get(style, camera_specs["realistic"]),
            lighting_specs.get(style, lighting_specs["realistic"])
        ]
        
        return ", ".join(enhanced_parts)
    
    def _extract_camera_info(self, style: str, quality: str) -> str:
        """Extract camera information based on style and quality"""
        camera_mapping = {
            "realistic": "DSLR camera, 85mm lens, f/1.8 aperture, ISO 100",
            "artistic": "Creative camera setup, artistic lens choice",
            "cinematic": "Cinema camera, anamorphic lens, professional setup",
            "fantasy": "Magical perspective capture",
            "anime": "Anime-style camera perspective"
        }
        return camera_mapping.get(style, camera_mapping["realistic"])
    
    def _extract_subjects(self, input_text: str) -> List[str]:
        """Extract main subjects from input text"""
        # Simple keyword extraction
        common_subjects = ['person', 'people', 'man', 'woman', 'child', 'animal', 'cat', 'dog', 
                          'car', 'building', 'tree', 'flower', 'landscape', 'portrait']
        
        found_subjects = []
        input_lower = input_text.lower()
        
        for subject in common_subjects:
            if subject in input_lower:
                found_subjects.append(subject)
        
        # If no subjects found, try to extract nouns (simple approach)
        if not found_subjects:
            words = input_text.split()
            # Take first few words as potential subjects
            found_subjects = words[:3] if len(words) >= 3 else words
        
        return found_subjects[:5]  # Limit to 5 subjects
    
    def _extract_environment(self, input_text: str, style: str) -> str:
        """Extract environment description"""
        environment_keywords = {
            'indoor': ['room', 'house', 'building', 'indoor', 'inside'],
            'outdoor': ['outside', 'outdoor', 'park', 'street', 'nature'],
            'studio': ['studio', 'professional', 'backdrop'],
            'natural': ['forest', 'mountain', 'beach', 'field', 'garden']
        }
        
        input_lower = input_text.lower()
        
        for env_type, keywords in environment_keywords.items():
            if any(keyword in input_lower for keyword in keywords):
                return f"{env_type} environment with detailed background"
        
        # Default based on style
        style_environments = {
            "realistic": "natural environment with realistic background",
            "artistic": "artistic environment with creative background",
            "cinematic": "cinematic environment with dramatic background",
            "fantasy": "magical environment with fantastical background",
            "anime": "anime-style environment with stylized background"
        }
        
        return style_environments.get(style, "detailed environment with appropriate background")
    
    def _extract_lighting(self, style: str) -> str:
        """Extract lighting description based on style"""
        lighting_mapping = {
            "realistic": "natural lighting with soft shadows and balanced exposure",
            "artistic": "creative lighting with artistic shadows and mood",
            "cinematic": "dramatic cinematic lighting with professional setup",
            "fantasy": "magical lighting with ethereal glow and mystical atmosphere",
            "anime": "anime-style lighting with vibrant illumination"
        }
        return lighting_mapping.get(style, lighting_mapping["realistic"])
    
    def _check_nsfw_content(self, input_text: str) -> bool:
        """Simple NSFW content detection"""
        nsfw_keywords = ['nude', 'naked', 'explicit', 'sexual', 'adult']
        input_lower = input_text.lower()
        return any(keyword in input_lower for keyword in nsfw_keywords)
    
    def _get_default_value(self, field: str) -> Any:
        """Get default value for missing fields"""
        defaults = {
            'prompt': 'Enhanced prompt',
            'camera': 'Professional camera setup',
            'subjects': [],
            'environment': 'Detailed environment',
            'lighting': 'Professional lighting',
            'nsfw': False,
            'metadata': {}
        }
        return defaults.get(field, None)
    
    def _create_fallback_result(self, input_text: str, style: str, quality: str, provider: str) -> Dict[str, Any]:
        """Create a fallback result when parsing fails"""
        return {
            "prompt": f"Enhanced {style} style prompt: {input_text}, high quality, professional",
            "camera": "Professional DSLR camera, 85mm lens, f/1.8",
            "subjects": self._extract_subjects(input_text),
            "environment": self._extract_environment(input_text, style),
            "lighting": self._extract_lighting(style),
            "nsfw": False,
            "metadata": {
                "style": style,
                "quality": quality,
                "provider": provider,
                "generated_at": datetime.now().isoformat(),
                "fallback": True
            }
        }
    
    async def _setup_api_keys(self, provider: str):
        """Setup API keys for the specified provider"""
        # This would typically load from database settings
        # For now, we'll use environment variables as fallback
        if provider == "openai":
            if not os.getenv("OPENAI_API_KEY"):
                print("Warning: OPENAI_API_KEY not found in environment")
        elif provider == "google":
            if not os.getenv("GOOGLE_API_KEY"):
                print("Warning: GOOGLE_API_KEY not found in environment")
    
    async def test_connection(self, provider: str, settings) -> bool:
        """Test API connection for the specified provider"""
        try:
            if provider == "openai" and settings.openai_api_key:
                # Test OpenAI connection
                os.environ["OPENAI_API_KEY"] = settings.openai_api_key
                return True
            elif provider == "google" and settings.google_api_key:
                # Test Google connection
                os.environ["GOOGLE_API_KEY"] = settings.google_api_key
                return True
            return False
        except Exception as e:
            print(f"Connection test failed: {e}")
            return False