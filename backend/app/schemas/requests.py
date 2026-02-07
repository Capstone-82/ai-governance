from pydantic import BaseModel, Field
from typing import Optional, List

# Single Request (Legacy support or single test)
class GovernanceRequest(BaseModel):
    query: str
    governance_context: str = Field("aws", description="The cloud provider context (aws, azure, gcp)")
    host_platform: str = Field("aws_bedrock", description="The AI host platform (aws_bedrock, gcp_vertex, openai)")
    model_id: str
    evaluator_model: Optional[str] = "gemini-2.5-pro"

# Batch Request Components
class ModelConfig(BaseModel):
    host_platform: str = Field("aws_bedrock", description="The AI host platform (aws_bedrock, gcp_vertex, openai)")
    model_id: str

class BatchGovernanceRequest(BaseModel):
    query: str
    governance_context: str = Field("aws", description="The cloud provider context (aws, azure, gcp)")
    models: List[ModelConfig]
    evaluator_model: Optional[str] = "gemini-2.5-pro"

class GovernanceResponse(BaseModel):
    result: str
    recommendation: str
