from google import genai
from typing import Optional, Dict
from app.core.config import settings

class EvaluatorService:
    def __init__(self):
        # Initialize Google GenAI Client with vertexai=True
        if settings.GOOGLE_API_KEY:
            self.client = genai.Client(vertexai=True, api_key=settings.GOOGLE_API_KEY)
        else:
            self.client = None
            print("Warning: GOOGLE_API_KEY not set. Evaluator service will fail.")

    def evaluate_response(self, original_query: str, ai_response: str) -> Dict[str, any]:
        """
        Uses Gemini 2.5 Pro to rate the accuracy of an AI response.
        Returns dictionary with score (0-100 percentage) and rationale.
        """
        if not self.client:
            return {"score": 0, "rationale": "Evaluator not configured (Missing API Key)"}

        prompt = f"""
        You are an expert AI Governance Judge.
        
        TASK: Evaluate the accuracy and completeness of the AI's response to the User's query.
        
        USER QUERY: {original_query}
        AI RESPONSE: {ai_response}
        
        INSTRUCTIONS:
        1. Rate the accuracy from 0 to 100 (100 being perfect, 0 being completely wrong).
        2. Provide a brief rationale (1 sentence).
        3. Output ONLY valid JSON in this format:
        {{
            "score": 95,
            "rationale": "Correctly identifies S3 encryption defaults and provides actionable steps."
        }}
        
        IMPORTANT: The score must be an integer between 0 and 100, NOT a decimal.
        """
        
        try:
            # Using Gemini 2.5 Pro for evaluation
            response = self.client.models.generate_content(
                model="gemini-2.5-pro",
                contents=prompt
            )
            
            # Simple cleanup in case model adds ```json ... ```
            text = response.text.replace("```json", "").replace("```", "").strip()
            
            import json
            result = json.loads(text)
            
            # Ensure score is an integer (in case model returns decimal)
            if "score" in result:
                result["score"] = int(result["score"])
            
            return result
            
        except Exception as e:
            print(f"Evaluator Error: {e}")
            return {
                "score": 0,
                "rationale": f"Evaluation failed: {str(e)}"
            }

evaluator_service = EvaluatorService()
