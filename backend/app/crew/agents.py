from crewai import Agent
from crewai_tools import BaseTool
from typing import Dict, Any

class PromptDrafterAgent:
    """Initial prompt drafter agent that refines vague user input"""
    
    def __init__(self):
        self.agent = Agent(
            role="Initial Prompt Drafter",
            goal="Transform vague user prompts into more refined and detailed prompts tailored for AI image generation",
            backstory="""You are an expert prompt engineer with deep understanding of AI image generation. 
            You specialize in taking basic, unclear, or incomplete user ideas and transforming them into 
            well-structured, detailed prompts that capture the user's intent while adding necessary 
            artistic and technical details.""",
            verbose=True,
            allow_delegation=False
        )
    
    def refine_prompt(self, user_prompt: str, nsfw_enabled: bool = False) -> str:
        """Refine the user's initial prompt"""
        nsfw_instruction = "" if nsfw_enabled else "Ensure the content is safe for work and appropriate for all audiences."
        
        task_description = f"""
        Take this user prompt: "{user_prompt}"
        
        Refine it into a more detailed and structured prompt that:
        1. Clarifies any vague elements
        2. Adds appropriate artistic context
        3. Maintains the user's original intent
        4. Provides enough detail for technical enhancement
        {nsfw_instruction}
        
        Return only the refined prompt text, no additional commentary.
        """
        
        return self.agent.execute_task(task_description)

class TechnicalEditorAgent:
    """Technical editor agent that adds camera and stylistic details"""
    
    def __init__(self):
        self.agent = Agent(
            role="Technical Editor",
            goal="Enhance refined prompts with detailed technical camera settings, lighting, and stylistic elements",
            backstory="""You are a professional photographer and cinematographer with expertise in 
            camera techniques, lighting setups, and visual composition. You understand how different 
            camera angles, lenses, and lighting conditions affect the mood and quality of images. 
            You specialize in translating artistic vision into technical specifications.""",
            verbose=True,
            allow_delegation=False
        )
    
    def enhance_technical_details(self, refined_prompt: str) -> Dict[str, Any]:
        """Add technical camera and lighting details"""
        
        task_description = f"""
        Take this refined prompt: "{refined_prompt}"
        
        Enhance it with specific technical details and return a structured response with:
        
        1. Camera settings (angle, lens type, framing)
        2. Subject details (mood, body attributes, age, wardrobe, pose)
        3. Environment description
        4. Lighting specifications
        
        Focus on technical precision while maintaining artistic vision.
        Consider professional photography and cinematography techniques.
        
        Return your response in a structured format that can be easily parsed.
        """
        
        return self.agent.execute_task(task_description)

class SupervisingEditorAgent:
    """Supervising editor that performs final review and formatting"""
    
    def __init__(self):
        self.agent = Agent(
            role="Supervising Editor",
            goal="Review and finalize prompt output, ensuring user preferences are incorporated and output is properly formatted",
            backstory="""You are a senior creative director with years of experience in visual arts, 
            photography, and AI image generation. You have a keen eye for detail and understand 
            how to balance technical requirements with artistic vision. You ensure that the final 
            output meets professional standards while respecting user preferences.""",
            verbose=True,
            allow_delegation=False
        )
    
    def finalize_prompt(self, technical_details: str, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Perform final review and format the output"""
        
        nsfw_setting = user_preferences.get('nsfw_enabled', False)
        provider = user_preferences.get('provider', 'openai')
        
        task_description = f"""
        Review this technical prompt details: "{technical_details}"
        
        User preferences:
        - NSFW enabled: {nsfw_setting}
        - Provider: {provider}
        
        Create a final, properly formatted JSON structure with these exact fields:
        {{
            "camera": {{
                "angle": "[camera angle]",
                "lens": "[lens type]",
                "framing": "[shot framing]"
            }},
            "subjects": [{{
                "mood": "[subject mood]",
                "body_attributes": "[physical attributes]",
                "age": [numeric age],
                "wardrobe": "[clothing description]",
                "pose": "[pose description]"
            }}],
            "environment": "[environment description]",
            "lighting": "[lighting description]",
            "nsfw": {str(nsfw_setting).lower()}
        }}
        
        Ensure the output is valid JSON and respects user preferences.
        Return ONLY the JSON structure, no additional text.
        """
        
        return self.agent.execute_task(task_description)