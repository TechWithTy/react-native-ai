from fastapi import APIRouter
from app.schemas.ai import AtsScanResult
from datetime import datetime

router = APIRouter()

@router.post("/ats/scan", response_model=AtsScanResult)
def scan_resume(resume_id: str, job_description: str):
    return AtsScanResult(
        id="scan_123",
        resume_id=resume_id,
        score=85,
        keywords_found=["React", "Python"],
        keywords_missing=["Docker"],
        created_at=datetime.now()
    )
