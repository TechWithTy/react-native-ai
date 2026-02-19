from fastapi import APIRouter
from app.schemas.analytics import DashboardData, PipelineStats, WeeklyProgress
from app.services.mock_data import get_mock_analytics

router = APIRouter()

@router.get("/dashboard", response_model=DashboardData)
def get_dashboard_data():
    data = get_mock_analytics()
    # Pydantic will validate the dictionary against the model
    return DashboardData(
        pipeline=data["pipeline"],
        weekly_progress=data["weekly_progress"],
        recent_activity=["Applied to Google", "Interview with Amazon"]
    )
