from typing import Optional

from crewai import Task

from ..models.schemas import GeneratedPromptData


class ImagePromptGenerationTasks:
    def refine_prompt(self, agent, initial_prompt: str):
        return Task(
            description=f"""
            Initial prompt: {initial_prompt}

            Build a complete prompt blueprint using the GeneratedPromptData schema. Populate each section:
            - version (default to the current schema version unless the user requests otherwise)
            - intent that captures the creative goal in a short phrase
            - prompt.primary as a rich natural-language description and prompt.negative for avoidances
            - subjects array with role, age descriptor, body_attributes, wardrobe, pose, and mood
            - environment string summarising the scene context
            - composition.camera (angle, lens, framing, depth_of_field), composition.shot, and composition.aspect_ratio
            - lighting conditions
            - style details including keywords, medium, and aesthetic_bias entries
            - color palette and dominant_colors list
            - controls (image_prompts, control_nets, loras) with URIs, weights, and ranges when applicable
            - params (width, height, steps, guidance, sampler, seed, images)
            - post (upscale mode/strength and face_restore flag)
            - safety.allow_nsfw and provider_overrides (use empty objects when you have no overrides)
            - notes with any execution hints for downstream agents

            Keep values accurate, concise, and production-ready.
            """,
            expected_output="A GeneratedPromptData JSON object fully populated for review",
            agent=agent
        )

    def edit_prompt(self, agent, context):
        return Task(
            description="""
            Review the drafted GeneratedPromptData payload and ensure:
            - All required schema sections are present and consistent
            - Field values are precise, free of redundancies, and adhere to industry terminology
            - Arrays contain meaningful entries (deduplicate keywords and dominant colours when needed)
            - Numeric parameters are valid for common diffusion workflows
            - provider_overrides keys exist even if their value is an empty object
            - Notes call out any assumptions or post-processing reminders
            """,
            agent=agent,
            context=context,
            expected_output="An edited GeneratedPromptData JSON object that satisfies the schema",
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

            Analyse the visual content and fill the GeneratedPromptData JSON schema so it reflects the scene:
            - Derive intent, prompt.primary, and prompt.negative from what is clearly visible
            - Describe subjects with role, age descriptor, body attributes, wardrobe, pose, and mood
            - Characterise the environment, lighting, composition (camera angle, lens, framing, depth of field, shot type, aspect ratio)
            - Capture style, colour palette, and dominant colours
            - Estimate relevant controls, params, and post-processing defaults; prefer realistic diffusion-friendly values
            - Set safety.allow_nsfw based on whether any explicit content is present (default to false if unsure)
            - Use empty lists or objects when the image provides no evidence for a field, and explain gaps in notes

            Avoid fabricating details not supported by the reference image.
            """,
            expected_output="A GeneratedPromptData JSON object that mirrors the analysed image",
            agent=agent,
            output_json=GeneratedPromptData
        )

