from typing import List
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.schemas.requests import GovernanceRequest, BatchGovernanceRequest
from app.schemas.governance import GovernanceLog
from app.services import ai_engine
import json
import asyncio

router = APIRouter()

@router.post("/analyze", response_model=GovernanceLog)
def analyze_cloud_governance(request: GovernanceRequest):
    """
    Analyze a cloud governance query using a SINGLE AI model.
    """
    try:
        log_entry = ai_engine.analyze_governance(
            query=request.query, 
            provider_str=request.host_platform, 
            model_id=request.model_id,
            governance_context=request.governance_context
        )
        return log_entry
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/batch", response_model=List[GovernanceLog])
async def analyze_batch_cloud_governance(request: BatchGovernanceRequest):
    """
    Analyze a query and run it against MULTIPLE AI models in parallel.
    Returns a list of results, one for each model.
    """
    try:
        results = await ai_engine.analyze_governance_batch(
            query=request.query,
            configs=request.models,
            evaluator_model=request.evaluator_model,
            governance_context=request.governance_context
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/stream")
async def analyze_batch_stream(request: BatchGovernanceRequest):
    """
    Stream results as each model completes (Server-Sent Events).
    Returns results progressively for better UX with many models.
    """
    HEARTBEAT_INTERVAL = 15  # seconds; keep Cloud Run proxy connection alive

    async def event_generator():
        try:
            # Send initial metadata
            yield f"data: {json.dumps({'type': 'start', 'total': len(request.models)})}\n\n"
            
            stream = ai_engine.analyze_governance_stream(
                query=request.query,
                configs=request.models,
                evaluator_model=request.evaluator_model,
                governance_context=request.governance_context
            )

            # Manual iteration so we can send heartbeat events during long model waits
            while True:
                try:
                    result = await asyncio.wait_for(stream.__anext__(), timeout=HEARTBEAT_INTERVAL)
                    # Send each result as it completes
                    event_data = {
                        'type': 'result',
                        'data': result.model_dump(mode='json')
                    }
                    yield f"data: {json.dumps(event_data)}\n\n"
                    await asyncio.sleep(0)  # Allow other tasks to run
                except asyncio.TimeoutError:
                    # SSE comment line as heartbeat to keep Cloud Run connection alive
                    yield ": ping\n\n"
                except StopAsyncIteration:
                    break
            
            # Send completion event
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"
            
        except Exception as e:
            error_data = {
                'type': 'error',
                'message': str(e)
            }
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )

@router.get("/health")
def health_check():
    return {"status": "ok"}
