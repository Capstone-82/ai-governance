import boto3
import json
import os
from dotenv import load_dotenv

# Load env
load_dotenv('backend/.env')

print(f"Checking AWS Region: {os.getenv('AWS_REGION')}")

try:
    client = boto3.client(
        'bedrock',
        region_name=os.getenv('AWS_REGION'),
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )
    
    # List foundational models
    print("\n--- Listing Foundational Models ---")
    response = client.list_foundation_models()
    models = response.get('modelSummaries', [])
    
    relevant_models = [m for m in models if 'anthropic' in m['modelId'] or 'meta' in m['modelId']]
    for m in relevant_models:
        print(f"ID: {m['modelId']} | Name: {m['modelName']}")
        
    print("\n--- Testing Claude 3.5 Sonnet Invocation ---")
    runtime = boto3.client(
        'bedrock-runtime',
        region_name=os.getenv('AWS_REGION'),
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )
    
    test_model = "anthropic.claude-3-5-sonnet-20240620-v1:0"
    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 10,
        "messages": [{"role": "user", "content": [{"type": "text", "text": "Hi"}]}]
    })
    
    try:
        response = runtime.invoke_model(modelId=test_model, body=body)
        print(f"SUCCESS: {test_model} is accessible!")
    except Exception as e:
        print(f"FAILURE: {test_model} failed: {str(e)}")

except Exception as e:
    print(f"CRITICAL ERROR: {str(e)}")
