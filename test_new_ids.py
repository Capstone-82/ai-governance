import boto3
import json
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

runtime = boto3.client(
    'bedrock-runtime',
    region_name=os.getenv('AWS_REGION'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

models_to_test = [
    "anthropic.claude-sonnet-4-20250514-v1:0",
    "meta.llama4-maverick-17b-instruct-v1:0"
]

for model_id in models_to_test:
    print(f"\nTesting {model_id}...")
    
    if "anthropic" in model_id:
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 100,
            "messages": [{"role": "user", "content": [{"type": "text", "text": "Hello, who are you?"}]}]
        })
    else: # Llama
        formatted_prompt = f"<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\nHello, who are you?<|eot_id|><|start_header_id|>assistant<|end_header_id|>"
        body = json.dumps({
            "prompt": formatted_prompt,
            "max_gen_len": 100,
            "temperature": 0.5
        })
        
    try:
        response = runtime.invoke_model(modelId=model_id, body=body)
        response_body = json.loads(response['body'].read())
        print(f"SUCCESS! Response: {response_body}")
    except Exception as e:
        print(f"FAILURE: {str(e)}")
