from .tasks import ImagePromptGenerationTasks
from ..models.schemas import GeneratePromptRequest, GeneratePromptResponse
from crewai import Crew, LLM, Process
from .agents import ImagePromptGenerationAgents

class ImagePromptGenerationCrew:
    """Manages the CrewAI workflow for prompt generation"""

    def __init__(self, llm: LLM):
        # Import classes
        self.agents = ImagePromptGenerationAgents(llm)
        self.tasks = ImagePromptGenerationTasks()

        # Initialize Agents
        self.prompt_drafter = self.agents.prompt_drafter_agent()
        self.supervising_editor = self.agents.supervising_editor_agent()

    def generate_structured_prompt(self, request: GeneratePromptRequest) -> GeneratePromptResponse:
        # Create tasks
        refine_prompt_task = self.tasks.refine_prompt(self.prompt_drafter, request.prompt) 
        edit_prompt_task = self.tasks.edit_prompt(self.supervising_editor, [refine_prompt_task])

        # Create crew
        crew = Crew(
            agents=[self.prompt_drafter, self.supervising_editor],
            tasks=[refine_prompt_task, edit_prompt_task],
            process=Process.sequential,
            verbose=True
        )

        # Execute the crew
        result = crew.kickoff()
        return GeneratePromptResponse(success=True, data=result.json_dict)
