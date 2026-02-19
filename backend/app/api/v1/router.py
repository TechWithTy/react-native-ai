from fastapi import APIRouter
from .endpoints.onboarding import router as onboarding
from .endpoints.jobs import router as jobs
from .endpoints.ai import router as ai
from .endpoints.wallet import router as wallet
from .endpoints.users import router as users
from .endpoints.analytics import router as analytics

api_router = APIRouter()

api_router.include_router(onboarding.router, prefix="/onboarding", tags=["Onboarding"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI"])
api_router.include_router(wallet.router, prefix="/wallet", tags=["Wallet"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
