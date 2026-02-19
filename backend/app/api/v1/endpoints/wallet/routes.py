from fastapi import APIRouter
from app.schemas.wallet import CreditBalance, SubscriptionTier
from app.services.mock_data import get_mock_credits, get_mock_subscription

router = APIRouter()

@router.get("/credits", response_model=CreditBalance)
def get_credits():
    return get_mock_credits()

@router.get("/subscription", response_model=SubscriptionTier)
def get_subscription():
    return get_mock_subscription()
