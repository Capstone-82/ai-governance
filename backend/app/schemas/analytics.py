from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

class ModelPerformance(BaseModel):
    model_id: str
    host_platform: str
    total_requests: int
    avg_accuracy: float
    avg_cost: float
    avg_latency_ms: float
    avg_input_tokens: int
    avg_output_tokens: int
    total_cost: float

class CostBreakdown(BaseModel):
    host_platform: str
    model_id: str
    total_requests: int
    total_cost: float
    avg_cost_per_request: float

class AccuracyTrend(BaseModel):
    date: str
    model_id: str
    avg_accuracy: float
    request_count: int

class ComplexityAnalysis(BaseModel):
    query_category: str
    model_id: str
    request_count: int
    avg_accuracy: float
    avg_latency_ms: float
    total_cost: float

class AnalyticsSummary(BaseModel):
    total_requests: int
    total_cost: float
    avg_accuracy: float
    avg_latency_ms: float
    top_model_by_accuracy: str
    most_cost_effective_model: str
