import uuid
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import Optional, List
from app.schemas.governance import (
    GovernanceLog, 
    ModelProvider, 
    UsageMetrics, 
    InvocationStatus,
    CostMetrics,
    AccuracyMetrics
)
from app.schemas.requests import ModelConfig
from app.core.config import settings
from app.services.llm_providers.bedrock import BedrockService
from app.services.llm_providers.openai_provider import OpenAIProvider
from app.services.llm_providers.vertex_provider import VertexProvider
from app.services.pricing_service import pricing_service
from app.services.db_service import db_service
from app.services.evaluator_service import evaluator_service

# Initialize providers
bedrock_service = BedrockService()
openai_service = OpenAIProvider()
vertex_service = VertexProvider()

def analyze_governance(query: str, provider_str: str, model_id: str, conversation_id: Optional[str] = None) -> GovernanceLog:
    """
    Orchestrates the AI analysis and persists the result.
    """
    
    start_time = datetime.utcnow()
    
    # 1. Conversation Management
    if not conversation_id:
        conv = db_service.create_conversation(title=query[:50])
        conversation_id = conv.id
        db_service.add_message(conversation_id, "user", query)

    # Map string provider to Enum
    provider_key = provider_str.lower()
    if "aws" in provider_key:
        provider = ModelProvider.AWS
    elif "openai" in provider_key:
        provider = ModelProvider.OPENAI
    elif "google" in provider_key or "gcp" in provider_key:
        provider = ModelProvider.GOOGLE
    else:
        provider = ModelProvider.OTHER

    # Initialize placeholders
    response_text = ""
    input_tokens = 0
    output_tokens = 0
    error_msg = None
    success = False

    try:
        if provider == ModelProvider.AWS:
            result = bedrock_service.invoke_model(model_id, query)
            response_text = result["response_text"]
            input_tokens = result["input_tokens"]
            output_tokens = result["output_tokens"]
            success = True
        elif provider == ModelProvider.OPENAI:
            # Call Real OpenAI Service
            result = openai_service.invoke_model(model_id, query)
            response_text = result["response_text"]
            input_tokens = result["input_tokens"]
            output_tokens = result["output_tokens"]
            success = True
        elif provider == ModelProvider.GOOGLE:
            # Call GCP Vertex AI Service
            result = vertex_service.invoke_model(model_id, query)
            response_text = result["response_text"]
            input_tokens = result["input_tokens"]
            output_tokens = result["output_tokens"]
            success = True
        else:
            time.sleep(0.1)
            response_text = f"Mock response from {provider}"
            input_tokens = 5
            output_tokens = 5
            success = True

    except Exception as e:
        error_msg = str(e)
        success = False
    
    # Calculate Latency
    end_time = datetime.utcnow()
    latency_ms = (end_time - start_time).total_seconds() * 1000

    usage = UsageMetrics(
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        total_tokens=input_tokens + output_tokens,
        latency_ms=latency_ms
    )
    
    # Calculate Real Cost
    cost_data = pricing_service.calculate_cost(
        provider=provider_str,
        model_name=model_id,
        input_tokens=input_tokens,
        output_tokens=output_tokens
    )
    
    cost = CostMetrics(
        input_cost=cost_data["input_cost"],
        output_cost=cost_data["output_cost"],
        total_cost=cost_data["total_cost"]
    )

    # Calculate Real Accuracy using Gemini
    accuracy_data = {"score": 0, "rationale": "Evaluation skipped (failed)"}
    if success:
        accuracy_data = evaluator_service.evaluate_response(query, response_text)
    
    accuracy = AccuracyMetrics(
        score=accuracy_data.get("score", 0),
        rationale=accuracy_data.get("rationale", "No rationale provided"),
        evaluator_model="gemini-2.5-pro"
    )

    # Create the log entry (Transient Pydantic Object)
    log_entry = GovernanceLog(
        id=str(uuid.uuid4()),
        trace_id=str(uuid.uuid4()),
        provider=provider,
        model_id=model_id,
        started_at=start_time,
        ended_at=end_time,
        usage=usage,
        cost=cost,
        accuracy=accuracy,
        status=InvocationStatus.COMPLETED if success else InvocationStatus.FAILED,
        success=success,
        error_message=error_msg,
        tags={"environment": "dev", "purpose": "governance_check"},
        input_prompt=query,
        response_text=response_text
    )
    
    # 2. Persist Assistant Response & Telemetry to DB
    msg = db_service.add_message(conversation_id, "assistant", response_text)
    db_service.add_telemetry(msg.id, log_entry.model_dump())
    
    return log_entry

async def analyze_governance_batch(query: str, configs: List[ModelConfig]) -> List[GovernanceLog]:
    loop = asyncio.get_running_loop()
    conv = db_service.create_conversation(title=query[:50])
    db_service.add_message(conv.id, "user", query)
    
    tasks = []
    with ThreadPoolExecutor(max_workers=len(configs) + 2) as executor:
        futures = [
            loop.run_in_executor(
                executor, 
                analyze_governance, 
                query, 
                config.host_platform, 
                config.model_id,
                conv.id 
            )
            for config in configs
        ]
        results = await asyncio.gather(*futures)
        
    return list(results)
