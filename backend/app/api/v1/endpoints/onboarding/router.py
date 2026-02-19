from fastapi import APIRouter
from .setup import router as setup_router

router = APIRouter()

router.include_router(setup_router)
