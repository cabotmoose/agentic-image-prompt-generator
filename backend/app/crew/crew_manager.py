from typing import Iterable

from crewai import Crew, Process
from pydantic import ValidationError

from .agents import ImagePromptGenerationAgents, PromptConversionAgents
from .tasks import ImagePromptGenerationTasks, PromptConversionTasks
from ..models.schemas import (
    ConvertPromptRequest,
    ConvertPromptResponse,
    GeneratePromptFromImageRequest,
    GeneratePromptRequest,
    GeneratePromptResponse,
    ProviderOptimizedPayload,
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
        token_usage = getattr(result, "token_usage", None)
        if token_usage is None:
            token_usage = getattr(result, "usage_metrics", None)
        data = getattr(result, "json_dict", None)
        return GeneratePromptResponse(success=True, data=data, token_usage=token_usage)

    def generate_structured_prompt(self, request: GeneratePromptRequest) -> GeneratePromptResponse:
        try:
            llm = self.provider_service.create_llm(request.provider, api_keys=request.provider_api_keys)
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
            llm = self.provider_service.create_llm(
                request.provider,
                require_vision=True,
                api_keys=request.provider_api_keys,
            )
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


class PromptConversionCrew:
    """Handles conversion of structured prompts into provider-optimised payloads."""

    def __init__(self, provider_service: ProviderConfigurationService) -> None:
        self.provider_service = provider_service
        self.tasks = PromptConversionTasks()

    @staticmethod
    def _run_crew(agents: Iterable, tasks: Iterable) -> ConvertPromptResponse:
        crew = Crew(agents=list(agents), tasks=list(tasks), process=Process.sequential, verbose=True)
        try:
            result = crew.kickoff()
        except Exception as error:  # pragma: no cover - CrewAI surfaces rich errors
            return ConvertPromptResponse(success=False, error=str(error))
        token_usage = getattr(result, "token_usage", None)
        if token_usage is None:
            token_usage = getattr(result, "usage_metrics", None)
        data_dict = getattr(result, "json_dict", None)
        if data_dict is None:
            return ConvertPromptResponse(success=False, error="Crew did not return JSON data.")
        try:
            payload = ProviderOptimizedPayload(**data_dict)
        except ValidationError as error:
            return ConvertPromptResponse(success=False, error=f"Invalid provider payload: {error}")
        return ConvertPromptResponse(success=True, data=payload, token_usage=token_usage)

    def convert_prompt(self, request: ConvertPromptRequest) -> ConvertPromptResponse:
        try:
            llm = self.provider_service.create_llm(request.provider, api_keys=request.provider_api_keys)
        except ValueError as error:
            return ConvertPromptResponse(success=False, error=str(error))

        agents_factory = PromptConversionAgents(llm)
        try:
            specialist = agents_factory.specialist_for(request.target_model)
        except ValueError as error:
            return ConvertPromptResponse(success=False, error=str(error))
        reviewer = agents_factory.conversion_reviewer_agent()

        convert_task = self.tasks.convert_prompt(specialist, request.target_model, request.data)
        review_task = self.tasks.review_conversion(reviewer, request.target_model, [convert_task])

        return self._run_crew(
            agents=[specialist, reviewer],
            tasks=[convert_task, review_task],
        )
