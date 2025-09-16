from typing import Optional

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

    def describe_image(self, agent, image_base64: str, filename: Optional[str] = None):
        preview = image_base64[:1200] + "..." if len(image_base64) > 1200 else image_base64
        name = filename or "uploaded reference"
        return Task(
            description=f"""
            You are provided with an uploaded reference image in base64 format.

            Filename: {name}
            Image data (base64): {preview}

            Use your multimodal capabilities to analyse the visual content of the image. Fill the GeneratedPromptData
            JSON schema so that it mirrors what you see:
            - Populate camera angle, lens, and framing using information implied by the shot
            - Describe overall style, environment, and lighting based purely on the scene
            - When people are present, add subjects with mood, age estimates, body attributes, wardrobe, and pose
            - If no data is apparent for a field, provide a short descriptive fallback rather than leaving it blank

            Avoid fabricating details that are not visually supported by the reference.
            """,
            expected_output="A GeneratedPromptData JSON object that captures camera, scene, lighting, and subjects from the image",
            agent=agent,
            output_json=GeneratedPromptData
        )
