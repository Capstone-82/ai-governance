from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from app.core.db import get_session
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.history import ConversationSummary, ConversationDetail, MessageDetail

router = APIRouter()

@router.get("/conversations", response_model=List[ConversationSummary])
def get_conversations(session: Session = Depends(get_session), limit: int = 50, offset: int = 0):
    """
    Get a list of recent conversations (for sidebar).
    """
    statement = select(Conversation).order_by(Conversation.created_at.desc()).offset(offset).limit(limit)
    conversations = session.exec(statement).all()
    
    results = []
    for conv in conversations:
        # Count messages - optimize this in production with a separate count query if needed
        count = len(conv.messages)
        results.append(ConversationSummary(
            id=conv.id,
            title=conv.title,
            created_at=conv.created_at,
            message_count=count
        ))
    return results

@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
def get_conversation_detail(conversation_id: str, session: Session = Depends(get_session)):
    """
    Get full details of a specific conversation, including messages and telemetry.
    """
    conv = session.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Sort messages by creation time
    sorted_messages = sorted(conv.messages, key=lambda x: x.created_at)
    
    message_details = []
    for msg in sorted_messages:
        # Because we defined relationships in SQLModel, msg.telemetry is automatically loaded (lazy usually, but works here)
        message_details.append(MessageDetail(
            id=msg.id,
            role=msg.role,
            content=msg.content,
            created_at=msg.created_at,
            telemetry=msg.telemetry # Pydantic will serialize the SQLModel object
        ))
        
    return ConversationDetail(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        message_count=len(sorted_messages),
        messages=message_details
    )

@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, session: Session = Depends(get_session)):
    """
    Delete a conversation and all its messages/telemetry.
    """
    conv = session.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    session.delete(conv) # Cascade delete should work if configured, otherwise we rely on ORM
    session.commit()
    return {"status": "deleted"}
