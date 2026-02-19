from app.schemas.base import BaseSchema
from pydantic import Field

class CareerGoal(BaseSchema):
    id: str
    description: str
    category: str  # e.g., 'skill', 'networking'
    completed: bool = False

class OnboardingSetup(BaseSchema):
    role_track: str  # e.g., 'Engineering'
    target_role: Optional[str] = None
    seniority_level: Optional[str] = Field(None, alias="seniority")
    desired_salary_min: Optional[int] = None
    desired_salary_max: Optional[int] = None
    desired_salary_text: Optional[str] = Field(None, alias="desiredSalaryRange")
    working_style: Optional[str] = None  # Remote/Hybrid/Onsite
    top_skills: List[str] = Field([], alias="selectedSkills")
    custom_goals: List[CareerGoal] = []
