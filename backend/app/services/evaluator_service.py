from google import genai
from typing import Optional, Dict
from app.core.config import settings
from app.services.llm_providers.openai_provider import OpenAIProvider
from app.services.llm_providers.bedrock import BedrockService

class EvaluatorService:
    def __init__(self):
        # Initialize Google GenAI Client
        if settings.GOOGLE_API_KEY:
            self.client = genai.Client(vertexai=True, api_key=settings.GOOGLE_API_KEY)
        else:
            self.client = None
            print("Warning: GOOGLE_API_KEY not set. Evaluator service will fail for Gemini models.")

        # Initialize OpenAI Provider
        self.openai_provider = OpenAIProvider()
        
        # Initialize Bedrock Provider
        self.bedrock_service = BedrockService()

    def evaluate_response(self, original_query: str, ai_response: str, model_id: str = "gemini-2.5-pro") -> Dict[str, any]:
        """
        Uses the specified 'Judge' model to rate the accuracy of an AI response.
        Returns dictionary with score (0-100 percentage) and rationale.
        """
        
        prompt = f"""
        You are an expert AI Governance Judge.
        
        TASK: Evaluate the accuracy and completeness of the AI's response to the User's query.
        Also, classify the query complexity and provide prompt optimization suggestions.
        
        USER QUERY: {original_query}
        AI RESPONSE: {ai_response}
        
        INSTRUCTIONS:
        1. Rate the accuracy from 0 to 100 (100 being perfect, 0 being completely wrong).
        2. Provide a brief rationale (1 sentence).
        3. Classify the query into ONE of these complexity levels: "Straightforward", "Mid-Level Complication", "Advanced Reasoning".
        4. Provide a suggestion to optimize the user's prompt for better results (1 sentence).
        
        5. Output ONLY valid JSON in this format:
        {{
            "score": 95,
            "rationale": "Correctly identifies S3 encryption defaults and provides actionable steps.",
            "query_category": "Advanced Reasoning",
            "prompt_optimization": "Specify the AWS region and specific encryption types (SSE-S3 vs KMS) for more precise advice."
        }}
        
        IMPORTANT: The score must be an integer between 0 and 100.
        """
        
        try:
            result_text = ""
            
            # ROUTING LOGIC based on model_id
            if "gpt" in model_id.lower() or "o1" in model_id.lower():
                # OpenAI Route
                if not settings.OPENAI_API_KEY:
                     return {"score": 0, "rationale": "Evaluator (OpenAI) not configured."}
                
                openai_res = self.openai_provider.invoke_model(model_id, prompt)
                result_text = openai_res["response_text"]
                
            elif "llama" in model_id.lower() or "bedrock" in model_id.lower():
                # Bedrock Route
                bedrock_res = self.bedrock_service.invoke_model(model_id, prompt)
                result_text = bedrock_res["response_text"]

            else:
                # Default: Google Route (Gemini)
                if not self.client:
                    return {"score": 0, "rationale": "Evaluator (Google) not configured."}
                
                # Check for "preview" models which might need specific handling or just work
                response = self.client.models.generate_content(
                    model=model_id,
                    contents=prompt
                )
                result_text = response.text
            
            # Clean up response (common for all providers)
            text = result_text.replace("```json", "").replace("```", "").strip()
            
            import json
            # Handle potential JSON parsing errors more gracefully
            try:
                result = json.loads(text)
            except json.JSONDecodeError:
                # Fallback if model returned plain text despite instructions
                return {
                    "score": 50,
                    "rationale": f"Evaluator Output Malformed: {text[:100]}"
                }
            
            # Ensure score is an integer
            if "score" in result:
                result["score"] = int(result["score"])
            
            # Tag which judge was used for transparency
            result["evaluator_model"] = model_id
            
            return result
            
        except Exception as e:
            print(f"Evaluator Error ({model_id}): {e}")
            return {
                "score": 0,
                "rationale": f"Evaluation failed: {str(e)}"
            }

evaluator_service = EvaluatorService()
