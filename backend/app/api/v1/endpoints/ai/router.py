from fastapi import APIRouter
from .coach import router as coach_router
from .ats import router as ats_router

router = APIRouter()

router.include_router(coach_router)
router.include_router(ats_router)
