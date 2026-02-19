from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

class BaseSchema(BaseModel):
    """
    Base schema configuration for consistent JSON serialization.
    Handles camelCase aliasing for frontend compatibility.
    """
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )
