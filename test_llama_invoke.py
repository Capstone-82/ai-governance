import boto3
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def test_model(model_id):
    print(f"\nTesting Model: {model_id}")
    
    client = boto3.client(
        'bedrock-runtime',
        region_name=os.getenv('AWS_REGION', 'us-east-1'),
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )

    prompt = "Why is the sky blue?"
    
    # Standard Llama 3 format used in your current codebase
    formatted_prompt = f"""
<|begin_of_text|><|start_header_id|>user<|end_header_id|>

{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>
"""
    
    body = json.dumps({
        "prompt": formatted_prompt,
        "max_gen_len": 128,
        "temperature": 0.5,
        "top_p": 0.9
    })

    try:
        print(f"Sending InvokeModel request...")
        response = client.invoke_model(
            modelId=model_id,
            body=body
        )
        
        raw_body_bytes = response['body'].read()
        print("Raw Response Bytes length:", len(raw_body_bytes))
        
        try:
            response_body = json.loads(raw_body_bytes)
            print("Response JSON Keys:", response_body.keys())
            print("Full Response Body:", json.dumps(response_body, indent=2))
        except json.JSONDecodeError:
            print("CRITICAL: Response is not valid JSON")
            print(raw_body_bytes)

    except Exception as e:
        print(f"ERROR invoking model: {str(e)}")

if __name__ == "__main__":
    # Test one of the failing models with the US cross-region inference profile
    test_model("us.meta.llama4-maverick-17b-instruct-v1:0")
