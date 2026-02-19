from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional

class UserProfile(BaseModel):
    id: str
    name: str = "Tyriq King"
    email: EmailStr = "tyriq@careerlift.io"
    avatar_url: Optional[str] = None
    current_location: Optional[str] = None
    is_open_to_work: bool = False
    bio: Optional[str] = None
    linkedin_connected: bool = False
    
    class Config:
        from_attributes = True
