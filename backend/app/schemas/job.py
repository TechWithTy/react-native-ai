from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.schemas.base import BaseSchema
from pydantic import Field

class JobEntry(BaseSchema):
    id: str
    company: str
    role: str
    location: Optional[str] = None
    status: str  # 'Applied', 'Interviewing', etc.
    next_action: Optional[str] = None
    next_action_date: Optional[datetime] = None
    is_overdue: bool = False
    logo_url: Optional[str] = Field(None, alias="logo")
    color: Optional[str] = None
    match_score: Optional[int] = Field(None, alias="match")
    tags: List[str] = []
    salary_range: Optional[str] = Field(None, alias="salary")
    notes: Optional[str] = None
    saved_from_recommended: bool = False

class JobCreate(BaseModel):
    company: str
    role: str
    status: str

class JobUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    next_action: Optional[str] = None
