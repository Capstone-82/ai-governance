from typing import List
from fastapi import APIRouter, HTTPException
from app.schemas.requests import GovernanceRequest, BatchGovernanceRequest
from app.schemas.governance import GovernanceLog
from app.services import ai_engine

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

@router.get("/health")
def health_check():
    return {"status": "ok"}
