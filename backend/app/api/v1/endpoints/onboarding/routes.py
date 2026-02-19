from fastapi import APIRouter
from app.schemas.onboarding import OnboardingSetup
from app.services.mock_data import get_mock_onboarding

router = APIRouter()

@router.get("/setup", response_model=OnboardingSetup)
def get_onboarding_setup():
    return get_mock_onboarding()

@router.post("/setup", response_model=OnboardingSetup)
def save_onboarding_setup(setup: OnboardingSetup):
    return setup
