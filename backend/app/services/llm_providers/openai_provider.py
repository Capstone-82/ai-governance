from openai import OpenAI
from app.core.config import settings
from typing import Dict, Any

class OpenAIProvider:
    def __init__(self):
        if settings.OPENAI_API_KEY:
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        else:
            self.client = None
            print("Warning: OPENAI_API_KEY not set.")

    def invoke_model(self, model_id: str, prompt: str) -> Dict[str, Any]:
        """
        Invokes OpenAI Chat Completion API.
        """
        if not self.client:
            raise ValueError("OpenAI Client not initialized (Missing Key)")

        response = self.client.chat.completions.create(
            model=model_id,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )

        # Extract usage
        usage = response.usage
        input_tokens = usage.prompt_tokens
        output_tokens = usage.completion_tokens
        response_text = response.choices[0].message.content

        return {
            "response_text": response_text,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens
        }
