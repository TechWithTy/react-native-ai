from fastapi import APIRouter
from .endpoints.onboarding import routes as onboarding_routes
from .endpoints.jobs import routes as jobs_routes
from .endpoints.ai import routes as ai_routes
from .endpoints.wallet import routes as wallet_routes
from .endpoints.users import routes as users_routes
from .endpoints.analytics import routes as analytics_routes

api_router = APIRouter()

api_router.include_router(onboarding_routes.router, prefix="/onboarding", tags=["Onboarding"])
api_router.include_router(jobs_routes.router, prefix="/jobs", tags=["Jobs"])
api_router.include_router(ai_routes.router, prefix="/ai", tags=["AI"])
api_router.include_router(wallet_routes.router, prefix="/wallet", tags=["Wallet"])
api_router.include_router(users_routes.router, prefix="/users", tags=["Users"])
api_router.include_router(analytics_routes.router, prefix="/analytics", tags=["Analytics"])
