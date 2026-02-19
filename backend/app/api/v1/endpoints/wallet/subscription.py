from fastapi import APIRouter
from app.schemas.wallet import SubscriptionTier
from app.services.mock_data import get_mock_subscription

router = APIRouter()

@router.get("/subscription", response_model=SubscriptionTier)
def get_subscription():
    return get_mock_subscription()
