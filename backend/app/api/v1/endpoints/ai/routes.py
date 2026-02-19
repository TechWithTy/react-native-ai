from fastapi import APIRouter
from typing import List
from app.schemas.ai import AICoachSession, AtsScanResult
from app.services.mock_data import get_mock_ai_sessions

router = APIRouter()

@router.get("/coach/sessions", response_model=List[AICoachSession])
def get_coach_sessions():
    return get_mock_ai_sessions()

@router.post("/ats/scan", response_model=AtsScanResult)
def scan_resume(resume_id: str, job_description: str):
    return AtsScanResult(
        id="scan_123",
        resume_id=resume_id,
        score=85,
        keywords_found=["React", "Python"],
        keywords_missing=["Docker"],
        created_at="2023-10-27T10:00:00"
    )
