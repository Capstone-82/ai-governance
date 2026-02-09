import boto3
import json
from typing import Dict, Any, Optional
from datetime import datetime
from app.core.config import settings

class BedrockService:
    def __init__(self):
        self.client = boto3.client(
            'bedrock-runtime',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )

    def invoke_model(self, model_id: str, prompt: str) -> Dict[str, Any]:
        """
        Generic invoker that handles payload differences between models
        """
        if "anthropic" in model_id:
            return self._invoke_claude(model_id, prompt)
        elif "meta" in model_id:
            return self._invoke_llama(model_id, prompt)
        else:
            raise ValueError(f"Unsupported Bedrock model: {model_id}")

    def _invoke_claude(self, model_id: str, prompt: str) -> Dict[str, Any]:
        # Claude 3 Messages API format
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2000,
            "messages": [
                {
                    "role": "user",
                    "content": [{"type": "text", "text": prompt}]
                }
            ]
        })
        
        try:
            response = self.client.invoke_model(
                modelId=model_id,
                body=body
            )
            
            raw_body = response['body'].read()
            response_body = json.loads(raw_body)
            
            # Parse usage and content
            usage = response_body.get('usage', {})
            input_tokens = usage.get('input_tokens', 0)
            output_tokens = usage.get('output_tokens', 0)
            
            # Handle different Claude 3 response structures if they occur
            if 'content' in response_body and len(response_body['content']) > 0:
                content_text = response_body['content'][0]['text']
            elif 'completion' in response_body:
                content_text = response_body['completion']
            else:
                print(f"WARNING: Unexpected Claude response format: {response_body}")
                content_text = str(response_body)

            return {
                "response_text": content_text,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens
            }
        except Exception as e:
            print(f"CRITICAL: Claude Bedrock Error ({model_id}): {str(e)}")
            if 'raw_body' in locals():
                print(f"Raw Response Body: {raw_body}")
            raise e

    def _invoke_llama(self, model_id: str, prompt: str) -> Dict[str, Any]:
        # Llama 3 format
        formatted_prompt = f"""
<|begin_of_text|><|start_header_id|>user<|end_header_id|>

{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>
"""
        body = json.dumps({
            "prompt": formatted_prompt,
            "max_gen_len": 2048,
            "temperature": 0.5,
            "top_p": 0.9
        })

        try:
            response = self.client.invoke_model(
                modelId=model_id,
                body=body
            )
            
            raw_body = response['body'].read()
            response_body = json.loads(raw_body)
            
            # Llama on Bedrock response extract
            content_text = response_body.get('generation', '')
            if not content_text and 'text' in response_body: # Potential newer format
                content_text = response_body['text']
            
            # Bedrock Llama includes token counts
            input_tokens = response_body.get('prompt_token_count', len(prompt.split()) * 1.3)
            output_tokens = response_body.get('generation_token_count', len(content_text.split()) * 1.3)

            return {
                "response_text": content_text,
                "input_tokens": int(input_tokens),
                "output_tokens": int(output_tokens)
            }
        except Exception as e:
            print(f"CRITICAL: Llama Bedrock Error ({model_id}): {str(e)}")
            if 'raw_body' in locals():
                print(f"Raw Response Body: {raw_body}")
            raise e
