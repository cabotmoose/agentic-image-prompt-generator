from typing import Iterable

from crewai import Crew, Process

from .agents import ImagePromptGenerationAgents
from .tasks import ImagePromptGenerationTasks
from ..models.schemas import (
    GeneratePromptFromImageRequest,
    GeneratePromptRequest,
    GeneratePromptResponse,
)
from ..services.provider_config import ProviderConfigurationService


class ImagePromptGenerationCrew:
    """Manages the CrewAI workflow for prompt generation."""

    def __init__(self, provider_service: ProviderConfigurationService) -> None:
        self.provider_service = provider_service
        self.tasks = ImagePromptGenerationTasks()

    @staticmethod
    def _run_crew(agents: Iterable, tasks: Iterable) -> GeneratePromptResponse:
        crew = Crew(agents=list(agents), tasks=list(tasks), process=Process.sequential, verbose=True)
        try:
            result = crew.kickoff()
        except Exception as error:  # pragma: no cover - CrewAI surfaces rich errors
            return GeneratePromptResponse(success=False, error=str(error))
        return GeneratePromptResponse(success=True, data=result.json_dict)

    def generate_structured_prompt(self, request: GeneratePromptRequest) -> GeneratePromptResponse:
        try:
            llm = self.provider_service.create_llm(request.provider)
        except ValueError as error:
            return GeneratePromptResponse(success=False, error=str(error))

        agents_factory = ImagePromptGenerationAgents(llm)
        prompt_drafter = agents_factory.prompt_drafter_agent()
        supervising_editor = agents_factory.supervising_editor_agent()

        refine_prompt_task = self.tasks.refine_prompt(prompt_drafter, request.prompt)
        edit_prompt_task = self.tasks.edit_prompt(supervising_editor, [refine_prompt_task])

        return self._run_crew(
            agents=[prompt_drafter, supervising_editor],
            tasks=[refine_prompt_task, edit_prompt_task],
        )

    def generate_structured_prompt_from_image(
        self, request: GeneratePromptFromImageRequest
    ) -> GeneratePromptResponse:
        try:
            llm = self.provider_service.create_llm(request.provider, require_vision=True)
        except ValueError as error:
            return GeneratePromptResponse(success=False, error=str(error))

        agents_factory = ImagePromptGenerationAgents(llm)
        image_analyst = agents_factory.image_description_agent()

        describe_image_task = self.tasks.describe_image(
            image_analyst, request.image_base64, request.filename
        )

        return self._run_crew(
            agents=[image_analyst],
            tasks=[describe_image_task],
        )
