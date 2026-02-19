from pydantic import BaseModel
from typing import Optional, List

class CareerGoal(BaseModel):
    id: str
    description: str
    category: str  # e.g., 'skill', 'networking'
    completed: bool = False

class OnboardingSetup(BaseModel):
    role_track: str  # e.g., 'Engineering'
    target_role: Optional[str] = None
    seniority_level: Optional[str] = None
    desired_salary_min: Optional[int] = None
    desired_salary_max: Optional[int] = None
    working_style: Optional[str] = None  # Remote/Hybrid/Onsite
    top_skills: List[str] = []
    custom_goals: List[CareerGoal] = []
