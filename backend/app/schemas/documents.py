from pydantic import BaseModel
from typing import Dict, Any, Optional

class DocumentRequest(BaseModel):
    template: str = "standard"
    data: Dict[str, Any]
