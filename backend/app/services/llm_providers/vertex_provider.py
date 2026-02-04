from google import genai
from typing import Dict, Any
from app.core.config import settings

class VertexProvider:
    def __init__(self):
        if settings.GOOGLE_API_KEY:
            # Using vertexai=True as per working reference
            self.client = genai.Client(vertexai=True, api_key=settings.GOOGLE_API_KEY)
        else:
            self.client = None
            print("Warning: GOOGLE_API_KEY not set. Vertex provider will fail.")

    def invoke_model(self, model_id: str, prompt: str) -> Dict[str, Any]:
        """
        Invokes Google Gemini models via genai SDK.
        """
        if not self.client:
            raise ValueError("Vertex Client not initialized (Missing API Key)")

        # Clean model ID (remove google/ prefix if present)
        clean_model_id = model_id.replace("google/", "")

        response = self.client.models.generate_content(
            model=clean_model_id,
            contents=prompt
        )

        # Extract usage metadata
        usage_metadata = response.usage_metadata if hasattr(response, 'usage_metadata') else None
        
        if usage_metadata:
            input_tokens = usage_metadata.prompt_token_count
            output_tokens = usage_metadata.candidates_token_count
        else:
            # Fallback estimation
            input_tokens = len(prompt.split()) * 1.3
            output_tokens = len(response.text.split()) * 1.3

        return {
            "response_text": response.text,
            "input_tokens": int(input_tokens),
            "output_tokens": int(output_tokens)
        }
