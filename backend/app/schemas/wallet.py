from pydantic import BaseModel
from typing import Optional, Dict

class CreditBalance(BaseModel):
    ai_credits: int
    scan_credits: int
    
class SubscriptionTier(BaseModel):
    id: str # 'starter', 'pro', 'unlimited'
    name: str
    features: list[str]
    price_monthly: float
    is_active: bool = False

class ExperimentVariant(BaseModel):
    experiment_id: str
    variant_id: str
    payload: Dict[str, str] # e.g., {'button_color': 'blue'}
