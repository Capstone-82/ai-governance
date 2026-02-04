from sqlmodel import Session, select
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.telemetry import GovernanceTelemetry
from app.core.db import engine
from typing import Optional
import uuid

class DBService:
    def create_conversation(self, title: str) -> Conversation:
        with Session(engine) as session:
            conv = Conversation(title=title)
            session.add(conv)
            session.commit()
            session.refresh(conv)
            return conv

    def add_message(self, conversation_id: str, role: str, content: str) -> Message:
        with Session(engine) as session:
            msg = Message(conversation_id=conversation_id, role=role, content=content)
            session.add(msg)
            session.commit()
            session.refresh(msg)
            return msg

    def add_telemetry(self, message_id: str, log_data: dict) -> GovernanceTelemetry:
        """
        Extracts relevant fields from GovernanceLog (dict) and saves GovernanceTelemetry
        """
        with Session(engine) as session:
            # Check if metrics are nested objects or dicts (Pydantic objects need .dict() or accessors)
            # Assuming log_data is the .model_dump() of GovernanceLog
            
            usage = log_data.get("usage", {})
            cost = log_data.get("cost", {})
            accuracy = log_data.get("accuracy", {})
            
            telemetry = GovernanceTelemetry(
                message_id=message_id,
                trace_id=log_data.get("trace_id"),
                governance_context=log_data.get("tags", {}).get("purpose", "unknown"), # Mapping issue, fixing below
                host_platform=str(log_data.get("provider")),
                model_id=log_data.get("model_id"),
                latency_ms=usage.get("latency_ms", 0.0),
                input_tokens=usage.get("input_tokens", 0),
                output_tokens=usage.get("output_tokens", 0),
                total_cost=cost.get("total_cost", 0.0),
                accuracy_score=accuracy.get("score", 0.0) if accuracy else 0.0,
                accuracy_rationale=accuracy.get("rationale") if accuracy else None,
            )
            session.add(telemetry)
            session.commit()
            session.refresh(telemetry)
            return telemetry

db_service = DBService()
