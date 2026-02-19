from fastapi import APIRouter
from typing import List
from app.schemas.ai import AICoachSession
from app.services.mock_data import get_mock_ai_sessions

router = APIRouter()

@router.get("/coach/sessions", response_model=List[AICoachSession])
def get_coach_sessions():
    return get_mock_ai_sessions()
