from crewai import Agent, LLM

class ImagePromptGenerationAgents:

    def __init__(self, llm: LLM):
        self.llm = llm
    
    def prompt_drafter_agent(self):
        return Agent(
            role="Initial Prompt Drafter",
            goal="Transform vague user prompts into more refined and detailed prompts tailored for AI image generation",
            backstory="""You are an expert prompt engineer with deep understanding of AI image generation. 
            You specialize in taking basic, unclear, or incomplete user ideas and transforming them into 
            well-structured, detailed prompts that capture the user's intent while adding necessary 
            artistic and technical details.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def supervising_editor_agent(self):
        return Agent(
            role="Supervising Editor",
            goal="Review and finalize the prompt, ensuring it aligns with user preferences and technical requirements",
            backstory=""""You are a senior creative director with years of experience in visual arts, 
            photography, and AI image generation. You have a keen eye for detail and understand 
            how to balance technical requirements with artistic vision. You ensure that the final 
            output meets professional standards while respecting user preferences.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def image_description_agent(self):
        return Agent(
            role="Image Description Agent",
            goal="Analyze uploaded images and provide detailed descriptions of their content",
            backstory="""You are a skilled image analyst with a deep understanding of visual elements, 
            scene composition, and object recognition. You excel at interpreting images and creating 
            comprehensive descriptions that capture the essence of the visual content.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

class PromptConversionAgents:
    """Agent factory for provider-specific prompt conversion."""

    def __init__(self, llm: LLM):
        self.llm = llm

    def _base_agent(self, role: str, goal: str, backstory: str) -> Agent:
        return Agent(
            role=role,
            goal=goal,
            backstory=backstory,
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
        )

    def flux_specialist_agent(self) -> Agent:
        return self._base_agent(
            role="Flux.1 Workflow Specialist",
            goal="Translate structured prompts into Flux.1-ready payloads that balance photorealism and cinematic flair",
            backstory="""You have production experience preparing prompts for Runway and Flux pipelines. You understand
            how diffusion-friendly fields map onto Flux.1 request bodies, optimal scheduler settings, and when to lean into
            high-frequency detail versus painterly looks.""",
        )

    def wan_specialist_agent(self) -> Agent:
        return self._base_agent(
            role="WAN 2.2 Optimisation Architect",
            goal="Generate photorealistic images leveraging WAN 2.2 strength in fine texture and realism.",
            backstory="""You are a model wrangler who tunes WAN 2.2 for lifelike materials and crisp detail while keeping prompts compact for throughput on a 4090.""",
        )

    def sdxl_specialist_agent(self) -> Agent:
        return self._base_agent(
            role="SDXL Workflow Specialist",
            goal="Convert structured prompts into SDXL request payloads tuned for base + refiner pipelines",
            backstory="""You help studios maintain SDXL pipelines. You can read a structured prompt and immediately map it to
            SDXL base/refiner parameters, including hi-res fix decisions, sampler selection, and denoising schedules.""",
        )

    def conversion_reviewer_agent(self) -> Agent:
        return self._base_agent(
            role="Conversion Quality Reviewer",
            goal="Validate provider-optimised payloads for completeness, accuracy, and deployability",
            backstory="""You audit cross-provider prompt conversions. You ensure the payload schema is satisfied, parameters are
            realistic, and any caveats are clearly called out before hand-off to downstream services.""",
        )

    def specialist_for(self, target_model: str) -> Agent:
        mapping = {
            "flux.1": self.flux_specialist_agent,
            "wan-2.2": self.wan_specialist_agent,
            "sdxl": self.sdxl_specialist_agent,
        }
        key = target_model.lower()
        if key not in mapping:
            raise ValueError(f"Unsupported conversion target '{target_model}'.")
        return mapping[key]()
