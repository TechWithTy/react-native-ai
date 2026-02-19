from fastapi import APIRouter
from app.schemas.wallet import CreditBalance
from app.services.mock_data import get_mock_credits

router = APIRouter()

@router.get("/credits", response_model=CreditBalance)
def get_credits():
    return get_mock_credits()
