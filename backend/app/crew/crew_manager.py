from crewai import Crew, Task
from .agents import PromptDrafterAgent, TechnicalEditorAgent, SupervisingEditorAgent
import json
import time
from typing import Dict, Any

class PromptGenerationCrew:
    """Manages the CrewAI workflow for prompt generation"""
    
    def __init__(self):
        # Initialize agents
        self.drafter = PromptDrafterAgent()
        self.technical_editor = TechnicalEditorAgent()
        self.supervising_editor = SupervisingEditorAgent()
        
        # Initialize crew
        self.crew = Crew(
            agents=[
                self.drafter.agent,
                self.technical_editor.agent,
                self.supervising_editor.agent
            ],
            verbose=True
        )
    
    def generate_prompt(self, user_prompt: str, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate enhanced prompt using the crew workflow"""
        start_time = time.time()
        
        try:
            # Step 1: Draft initial refinement
            refined_prompt = self._execute_drafting_task(user_prompt, user_preferences)
            
            # Step 2: Add technical details
            technical_details = self._execute_technical_task(refined_prompt)
            
            # Step 3: Final review and formatting
            final_output = self._execute_supervising_task(technical_details, user_preferences)
            
            processing_time = time.time() - start_time
            
            # Parse the JSON output
            try:
                if isinstance(final_output, str):
                    result_data = json.loads(final_output)
                else:
                    result_data = final_output
                
                return {
                    "success": True,
                    "data": result_data,
                    "processing_time": processing_time
                }
            except json.JSONDecodeError:
                # Fallback: create structured output manually
                return self._create_fallback_output(user_prompt, user_preferences, processing_time)
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "processing_time": time.time() - start_time
            }
    
    def _execute_drafting_task(self, user_prompt: str, user_preferences: Dict[str, Any]) -> str:
        """Execute the initial drafting task"""
        nsfw_enabled = user_preferences.get('nsfw_enabled', False)
        
        task = Task(
            description=f"""
            Refine this user prompt: "{user_prompt}"
            
            Transform it into a more detailed and structured prompt that:
            1. Clarifies any vague elements
            2. Adds appropriate artistic context
            3. Maintains the user's original intent
            4. Provides enough detail for technical enhancement
            {'Ensure content is appropriate for all audiences.' if not nsfw_enabled else ''}
            
            Return only the refined prompt text.
            """,
            agent=self.drafter.agent,
            expected_output="A refined and detailed prompt text"
        )
        
        return task.execute()
    
    def _execute_technical_task(self, refined_prompt: str) -> str:
        """Execute the technical enhancement task"""
        task = Task(
            description=f"""
            Enhance this refined prompt with technical details: "{refined_prompt}"
            
            Add specific technical elements:
            1. Camera settings (angle, lens type, framing)
            2. Subject details (mood, body attributes, age, wardrobe, pose)
            3. Environment description
            4. Lighting specifications
            
            Focus on professional photography and cinematography techniques.
            Provide structured technical details that can be easily formatted.
            """,
            agent=self.technical_editor.agent,
            expected_output="Enhanced prompt with detailed technical specifications"
        )
        
        return task.execute()
    
    def _execute_supervising_task(self, technical_details: str, user_preferences: Dict[str, Any]) -> str:
        """Execute the final supervising task"""
        nsfw_setting = user_preferences.get('nsfw_enabled', False)
        
        task = Task(
            description=f"""
            Create final JSON output from these technical details: "{technical_details}"
            
            User preferences: NSFW enabled: {nsfw_setting}
            
            Format as valid JSON with these exact fields:
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
            
            Return ONLY valid JSON, no additional text.
            """,
            agent=self.supervising_editor.agent,
            expected_output="Valid JSON structure with all required fields"
        )
        
        return task.execute()
    
    def _create_fallback_output(self, user_prompt: str, user_preferences: Dict[str, Any], processing_time: float) -> Dict[str, Any]:
        """Create fallback output if JSON parsing fails"""
        return {
            "success": True,
            "data": {
                "camera": {
                    "angle": "medium shot",
                    "lens": "50mm",
                    "framing": "centered"
                },
                "subjects": [{
                    "mood": "neutral",
                    "body_attributes": "average build",
                    "age": 25,
                    "wardrobe": "casual clothing",
                    "pose": "natural stance"
                }],
                "environment": user_prompt,
                "lighting": "natural lighting",
                "nsfw": user_preferences.get('nsfw_enabled', False)
            },
            "processing_time": processing_time
        }