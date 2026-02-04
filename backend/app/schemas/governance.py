from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum
from pydantic import BaseModel, Field, computed_field

class ModelProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    AWS = "aws"
    AZURE = "azure"
    OTHER = "other"

class InvocationStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class UsageMetrics(BaseModel):
    """Raw usage metrics from the LLM provider"""
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    latency_ms: float = 0.0
    
    @computed_field
    def total_tokens_calc(self) -> int:
        return self.input_tokens + self.output_tokens

class CostMetrics(BaseModel):
    """Calculated cost metrics"""
    input_cost: float = 0.0
    output_cost: float = 0.0
    total_cost: float = 0.0
    currency: str = "USD"
    
class AccuracyMetrics(BaseModel):
    """Metrics related to the quality/accuracy of the response"""
    score: float = Field(default=0.0, description="Accuracy score (0.0 to 1.0)")
    rationale: Optional[str] = Field(None, description="Explanation for the score")
    evaluator_model: Optional[str] = Field(None, description="Model used to evaluate accuracy")

class GovernanceLog(BaseModel):
    """
    Central governance schema for all AI invocations.
    Aligns with frontend 'ModelRun' and 'InvocationTelemetry'.
    """
    id: str = Field(..., description="Unique invocation ID")
    trace_id: Optional[str] = Field(None, description="Distributed trace ID for observability")
    
    # Metadata
    provider: ModelProvider
    model_id: str
    client_id: Optional[str] = None
    user_id: Optional[str] = None
    tags: Dict[str, str] = Field(default_factory=dict)
    
    # Timing
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    
    # Data
    usage: UsageMetrics = Field(default_factory=UsageMetrics)
    cost: Optional[CostMetrics] = None
    accuracy: Optional[AccuracyMetrics] = None # New field for accuracy scoring
    
    # Outcome
    status: InvocationStatus = InvocationStatus.PENDING
    success: bool = False
    error_message: Optional[str] = None
    
    # Content
    input_prompt: Optional[str] = None # Added field
    response_text: Optional[str] = None # Added field
    input_hash: Optional[str] = None
    output_hash: Optional[str] = None
    
    class Config:
        use_enum_values = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class GovernanceReviewResponse(BaseModel):
    """Response from a governance check (pre-invocation)"""
    allowed: bool
    reason: str
    policy_id: Optional[str] = None
