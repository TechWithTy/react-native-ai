from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class AICoachSession(BaseModel):
    id: str
    topic: str
    messages: List[Dict[str, str]] = []
    created_at: datetime
    updated_at: datetime

class InterviewPrep(BaseModel):
    id: str
    role_title: str
    company_name: Optional[str] = None
    questions: List[str] = []
    status: str = "Draft" # Draft, Ready, Completed
    
class AtsFix(BaseModel):
    id: str
    level: str # 'P0', 'P1', etc.
    title: str
    description: str
    tag: str
    
class AtsScanResult(BaseModel):
    id: str
    job_id: Optional[str] = None
    resume_id: str
    score: int
    keywords_found: List[str] = []
    keywords_missing: List[str] = []
    fixes: List[AtsFix] = []
    created_at: datetime

class TextGenerationRequest(BaseModel):
    prompt: str
    provider: Optional[str] = "openai"
    model: Optional[str] = "gpt-4o"
    max_tokens: Optional[int] = 1000

class ImageGenerationRequest(BaseModel):
    prompt: str
    provider: Optional[str] = "openai"

class GenerationResponse(BaseModel):
    status: str
    result: Optional[str] = None
    error: Optional[str] = None
