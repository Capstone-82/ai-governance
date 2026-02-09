import boto3
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

client = boto3.client(
    'bedrock',
    region_name=os.getenv('AWS_REGION'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

response = client.list_foundation_models()
models = response.get('modelSummaries', [])
with open('verified_ids.txt', 'w') as f:
    for m in models:
        f.write(f"{m['modelId']}\n")
print("Done writing to verified_ids.txt")
