from app.schemas.base import BaseSchema
from pydantic import Field

class CreditBalance(BaseSchema):
    ai_credits: int = Field(alias="balance")
    scan_credits: int = Field(alias="scanCreditsRemaining")
    
class SubscriptionTier(BaseSchema):
    id: str # 'starter', 'pro', 'unlimited'
    name: str
    features: list[str]
    price_monthly: float
    is_active: bool = False

class ExperimentVariant(BaseModel):
    experiment_id: str
    variant_id: str
    payload: Dict[str, str] # e.g., {'button_color': 'blue'}
