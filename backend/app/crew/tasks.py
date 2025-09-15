from crewai import Task
from ..models.schemas import GeneratedPromptData

class ImagePromptGenerationTasks:
    def refine_prompt(self, agent, initial_prompt: str):
        return Task(
            description=f"""
            Initial prompt: {initial_prompt}

            Refine the initial prompt into a more detailed and creative image prompt that includes:
            - A detailed subject description
            - Camera and lens specifications
            - Style (photorealistic, cartoon, painting, etc.)
            - Lighting conditions
            - Environment and background details
            - Artistic style elements
            """,
            expected_output="A detailed and creative image prompt with subject, camera, style, and lighting details",
            agent=agent
        )

    def edit_prompt(self, agent, context):
        return Task(
            description=f"""
            Edit the refined prompt by:
            - Ensuring all elements are included
            - Removing any unnecessary words or phrases
            - Making the prompt more concise and clear, particularly the environment details
            """,
            agent=agent,
            context=context,
            expected_output="An edited and refined image prompt in the required output format",
            output_json=GeneratedPromptData
        )
