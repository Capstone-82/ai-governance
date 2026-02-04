from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
import uuid

if TYPE_CHECKING:
    from .message import Message

class GovernanceTelemetry(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    message_id: Optional[str] = Field(default=None, foreign_key="message.id")
    
    # Context
    trace_id: str = Field(index=True)
    governance_context: str # e.g. aws, azure
    host_platform: str # e.g. aws_bedrock, openai
    
    # Model info
    model_id: str = Field(index=True)
    
    # Metrics
    latency_ms: float
    input_tokens: int
    output_tokens: int
    total_cost: float
    
    # Accuracy / Quality (aggregated here for easy dashboard queries)
    accuracy_score: float = Field(default=0.0)
    accuracy_rationale: Optional[str] = None
    
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationship
    message: Optional["Message"] = Relationship(back_populates="telemetry")
