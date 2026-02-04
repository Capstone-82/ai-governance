from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
import uuid

if TYPE_CHECKING:
    from .conversation import Conversation
    from .telemetry import GovernanceTelemetry

class Message(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    conversation_id: str = Field(foreign_key="conversation.id", index=True)
    role: str # 'user' or 'assistant'
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    conversation: "Conversation" = Relationship(back_populates="messages")
    telemetry: Optional["GovernanceTelemetry"] = Relationship(back_populates="message")
