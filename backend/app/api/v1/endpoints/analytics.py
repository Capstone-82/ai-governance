from typing import List
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, func
from app.core.db import get_session
from app.models.telemetry import GovernanceTelemetry
from app.schemas.analytics import (
    ModelPerformance, 
    CostBreakdown, 
    AccuracyTrend,
    AnalyticsSummary,
    ComplexityAnalysis
)
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/model-performance", response_model=List[ModelPerformance])
def get_model_performance(
    session: Session = Depends(get_session),
    limit: int = Query(50, description="Max number of models to return")
):
    """
    Get aggregated performance metrics for each model.
    Returns average accuracy, cost, latency, and token usage per model.
    """
    # SQL aggregation query
    statement = (
        select(
            GovernanceTelemetry.model_id,
            GovernanceTelemetry.host_platform,
            func.count(GovernanceTelemetry.id).label("total_requests"),
            func.avg(GovernanceTelemetry.accuracy_score).label("avg_accuracy"),
            func.avg(GovernanceTelemetry.total_cost).label("avg_cost"),
            func.avg(GovernanceTelemetry.latency_ms).label("avg_latency_ms"),
            func.avg(GovernanceTelemetry.input_tokens).label("avg_input_tokens"),
            func.avg(GovernanceTelemetry.output_tokens).label("avg_output_tokens"),
            func.sum(GovernanceTelemetry.total_cost).label("total_cost")
        )
        .group_by(GovernanceTelemetry.model_id, GovernanceTelemetry.host_platform)
        .order_by(func.count(GovernanceTelemetry.id).desc())
        .limit(limit)
    )
    
    results = session.exec(statement).all()
    
    return [
        ModelPerformance(
            model_id=row.model_id,
            host_platform=row.host_platform,
            total_requests=row.total_requests,
            avg_accuracy=round(row.avg_accuracy or 0, 2),
            avg_cost=round(row.avg_cost or 0, 6),
            avg_latency_ms=round(row.avg_latency_ms or 0, 2),
            avg_input_tokens=int(row.avg_input_tokens or 0),
            avg_output_tokens=int(row.avg_output_tokens or 0),
            total_cost=round(row.total_cost or 0, 4)
        )
        for row in results
    ]

@router.get("/cost-breakdown", response_model=List[CostBreakdown])
def get_cost_breakdown(
    session: Session = Depends(get_session),
    group_by: str = Query("model", description="Group by 'model' or 'platform'")
):
    """
    Get cost breakdown by model or platform.
    Shows total spend and average cost per request.
    """
    if group_by == "platform":
        statement = (
            select(
                GovernanceTelemetry.host_platform,
                func.literal("All Models").label("model_id"),
                func.count(GovernanceTelemetry.id).label("total_requests"),
                func.sum(GovernanceTelemetry.total_cost).label("total_cost"),
                func.avg(GovernanceTelemetry.total_cost).label("avg_cost_per_request")
            )
            .group_by(GovernanceTelemetry.host_platform)
            .order_by(func.sum(GovernanceTelemetry.total_cost).desc())
        )
    else:
        statement = (
            select(
                GovernanceTelemetry.host_platform,
                GovernanceTelemetry.model_id,
                func.count(GovernanceTelemetry.id).label("total_requests"),
                func.sum(GovernanceTelemetry.total_cost).label("total_cost"),
                func.avg(GovernanceTelemetry.total_cost).label("avg_cost_per_request")
            )
            .group_by(GovernanceTelemetry.host_platform, GovernanceTelemetry.model_id)
            .order_by(func.sum(GovernanceTelemetry.total_cost).desc())
        )
    
    results = session.exec(statement).all()
    
    return [
        CostBreakdown(
            host_platform=row.host_platform,
            model_id=row.model_id,
            total_requests=row.total_requests,
            total_cost=round(row.total_cost or 0, 4),
            avg_cost_per_request=round(row.avg_cost_per_request or 0, 6)
        )
        for row in results
    ]

@router.get("/accuracy-trends", response_model=List[AccuracyTrend])
def get_accuracy_trends(
    session: Session = Depends(get_session),
    days: int = Query(7, description="Number of days to analyze")
):
    """
    Get accuracy trends over time for each model.
    Groups by date and model to show performance evolution.
    """
    # Calculate date threshold
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # SQLite date function
    statement = (
        select(
            func.date(GovernanceTelemetry.timestamp).label("date"),
            GovernanceTelemetry.model_id,
            func.avg(GovernanceTelemetry.accuracy_score).label("avg_accuracy"),
            func.count(GovernanceTelemetry.id).label("request_count")
        )
        .where(GovernanceTelemetry.timestamp >= cutoff_date)
        .group_by(func.date(GovernanceTelemetry.timestamp), GovernanceTelemetry.model_id)
        .order_by(func.date(GovernanceTelemetry.timestamp).desc())
    )
    
    results = session.exec(statement).all()
    
    return [
        AccuracyTrend(
            date=str(row.date),
            model_id=row.model_id,
            avg_accuracy=round(row.avg_accuracy or 0, 2),
            request_count=row.request_count
        )
        for row in results
    ]

@router.get("/complexity-analysis", response_model=List[ComplexityAnalysis])
def get_complexity_analysis(
    session: Session = Depends(get_session)
):
    """
    Get performance metrics grouped by query complexity category.
    Allows comparing how models perform on 'Straightforward' vs 'Advanced' queries.
    """
    statement = (
        select(
            GovernanceTelemetry.query_category,
            GovernanceTelemetry.model_id,
            func.count(GovernanceTelemetry.id).label("request_count"),
            func.avg(GovernanceTelemetry.accuracy_score).label("avg_accuracy"),
            func.avg(GovernanceTelemetry.latency_ms).label("avg_latency_ms"),
            func.sum(GovernanceTelemetry.total_cost).label("total_cost")
        )
        .where(GovernanceTelemetry.query_category != None)
        .group_by(GovernanceTelemetry.query_category, GovernanceTelemetry.model_id)
        .order_by(GovernanceTelemetry.query_category, func.avg(GovernanceTelemetry.accuracy_score).desc())
    )
    
    results = session.exec(statement).all()
    
    return [
        ComplexityAnalysis(
            query_category=row.query_category,
            model_id=row.model_id,
            request_count=row.request_count,
            avg_accuracy=round(row.avg_accuracy or 0, 2),
            avg_latency_ms=round(row.avg_latency_ms or 0, 2),
            total_cost=round(row.total_cost or 0, 6)
        )
        for row in results
    ]

@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(session: Session = Depends(get_session)):
    """
    Get overall analytics summary across all models.
    """
    # Overall stats
    overall_stats = session.exec(
        select(
            func.count(GovernanceTelemetry.id).label("total_requests"),
            func.sum(GovernanceTelemetry.total_cost).label("total_cost"),
            func.avg(GovernanceTelemetry.accuracy_score).label("avg_accuracy"),
            func.avg(GovernanceTelemetry.latency_ms).label("avg_latency_ms")
        )
    ).first()
    
    # Top model by accuracy
    top_accuracy = session.exec(
        select(
            GovernanceTelemetry.model_id,
            func.avg(GovernanceTelemetry.accuracy_score).label("avg_acc")
        )
        .group_by(GovernanceTelemetry.model_id)
        .order_by(func.avg(GovernanceTelemetry.accuracy_score).desc())
        .limit(1)
    ).first()
    
    # Most cost-effective (best accuracy per dollar)
    cost_effective = session.exec(
        select(
            GovernanceTelemetry.model_id,
            (func.avg(GovernanceTelemetry.accuracy_score) / func.avg(GovernanceTelemetry.total_cost)).label("efficiency")
        )
        .where(GovernanceTelemetry.total_cost > 0)
        .group_by(GovernanceTelemetry.model_id)
        .order_by((func.avg(GovernanceTelemetry.accuracy_score) / func.avg(GovernanceTelemetry.total_cost)).desc())
        .limit(1)
    ).first()
    
    return AnalyticsSummary(
        total_requests=overall_stats.total_requests or 0,
        total_cost=round(overall_stats.total_cost or 0, 4),
        avg_accuracy=round(overall_stats.avg_accuracy or 0, 2),
        avg_latency_ms=round(overall_stats.avg_latency_ms or 0, 2),
        top_model_by_accuracy=top_accuracy.model_id if top_accuracy else "N/A",
        most_cost_effective_model=cost_effective.model_id if cost_effective else "N/A"
    )
