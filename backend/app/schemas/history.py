from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.models.telemetry import GovernanceTelemetry

class ConversationSummary(BaseModel):
    id: str
    title: str
    created_at: datetime
    message_count: int

class MessageDetail(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime
    telemetry: Optional[GovernanceTelemetry] = None
    
    class Config:
        arbitrary_types_allowed = True

class ConversationDetail(ConversationSummary):
    messages: List[MessageDetail]
