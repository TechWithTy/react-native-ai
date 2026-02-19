from fastapi import APIRouter
from .credits import router as credits_router
from .subscription import router as subscription_router

router = APIRouter()

router.include_router(credits_router)
router.include_router(subscription_router)
