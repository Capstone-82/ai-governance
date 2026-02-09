import boto3
import os
import json
from dotenv import load_dotenv

load_dotenv('backend/.env')

print("Starting profile list...")

try:
    client = boto3.client(
        'bedrock',
        region_name=os.getenv('AWS_REGION', 'us-east-1'),
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )

    response = client.list_inference_profiles()
    profiles = response.get('inferenceProfileSummaries', [])
    
    print(f"Total profiles found: {len(profiles)}")
    
    for p in profiles:
        print(f"Profile ID: {p.get('inferenceProfileId')}")
        print(f"Name: {p.get('inferenceProfileName')}")
        # print description if exists
        if 'description' in p:
            print(f"Description: {p.get('description')}")
        models = p.get('models', [])
        if models:
            print("Models:")
            for m in models:
                print(f" - {m.get('modelArn')}")
        print("-" * 30)

except Exception as e:
    print(f"Error: {e}")
