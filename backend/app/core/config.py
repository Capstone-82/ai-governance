from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Cloud Governance"
    API_V1_STR: str = "/api/v1"
    
    # AWS Credentials
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    
    # AI Provider Keys
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None

    # AWS Bedrock Guardrails
    AWS_BEDROCK_GUARDRAIL_ID: Optional[str] = None
    AWS_BEDROCK_GUARDRAIL_VERSION: str = "DRAFT"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
