import boto3
import os
import json
from dotenv import load_dotenv

load_dotenv('backend/.env')

def list_inference_profiles():
    client = boto3.client(
        'bedrock',
        region_name=os.getenv('AWS_REGION', 'us-east-1'),
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )

    try:
        response = client.list_inference_profiles()
        profiles = response.get('inferenceProfileSummaries', [])
        
        print(f"Found {len(profiles)} Inference Profiles:")
        for p in profiles:
            # Check if it's related to Llama
            if "llama" in p['inferenceProfileId'].lower() or "llama" in p.get('models', [{}])[0].get('modelArn', '').lower():
                print(f"Name: {p.get('inferenceProfileName')}")
                print(f"ID: {p.get('inferenceProfileId')}")
                print(f"Models: {json.dumps(p.get('models'), indent=2)}")
                print("-" * 40)
                
    except Exception as e:
        print(f"Error listing profiles: {e}")

if __name__ == "__main__":
    list_inference_profiles()
