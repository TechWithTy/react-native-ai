from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class JobEntry(BaseModel):
    id: str
    company: str
    role: str
    location: Optional[str] = None
    status: str  # 'Applied', 'Interviewing', etc.
    next_action: Optional[str] = None
    next_action_date: Optional[datetime] = None
    is_overdue: bool = False
    logo_url: Optional[str] = None
    color: Optional[str] = None
    match_score: Optional[int] = None
    tags: List[str] = []
    salary_range: Optional[str] = None
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
