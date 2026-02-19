from pydantic import BaseModel
from typing import Dict, List

class PipelineStats(BaseModel):
    total_jobs: int
    applied: int
    interviewing: int
    offers: int
    rejected: int

class WeeklyProgress(BaseModel):
    week_start: str
    applications_sent: int
    interviews_completed: int
    goal_applications: int = 5

class DashboardData(BaseModel):
    pipeline: PipelineStats
    weekly_progress: WeeklyProgress
    recent_activity: List[str] = []
