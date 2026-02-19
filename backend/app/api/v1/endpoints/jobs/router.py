from fastapi import APIRouter
from .job_routes import router as jobs_router

router = APIRouter()

router.include_router(jobs_router)
