from fastapi import APIRouter
from app.schemas.user import UserProfile
from app.services.mock_data import get_mock_user_profile

router = APIRouter()

@router.get("/profile", response_model=UserProfile)
def get_user_profile():
    """
    Get the current user's profile.
    """
    return get_mock_user_profile()

@router.put("/profile", response_model=UserProfile)
def update_user_profile(profile: UserProfile):
    """
    Update the user's profile.
    """
    return profile
