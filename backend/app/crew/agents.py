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
