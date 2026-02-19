from fastapi import APIRouter
from typing import List
from app.schemas.job import JobEntry, JobCreate
from app.services.mock_data import get_mock_jobs

router = APIRouter()

@router.get("/", response_model=List[JobEntry])
def get_jobs():
    return get_mock_jobs()

@router.post("/", response_model=JobEntry)
def create_job(job: JobCreate):
    # In a real app, this would save to DB
    return JobEntry(
        id="new_job_123",
        company=job.company,
        role=job.role,
        status=job.status,
        updated_at="2023-10-27T10:00:00"
    )
