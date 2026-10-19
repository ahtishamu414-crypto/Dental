from pydantic import BaseModel, Field
from typing import Optional, List, Dict


class ServiceModel(BaseModel):
    """Model for a single dental service with pricing."""
    id: Optional[str] = Field(default=None, description="Unique identifier for service")
    name: str = Field(min_length=1, max_length=100, description="Service name (e.g. Teeth Whitening)")
    description: str = Field(min_length=1, max_length=300, description="Service description")
    price: str = Field(min_length=1, max_length=50, description="Price string (e.g. $450 or $250 per tooth)")
    is_active: bool = Field(default=True, description="Whether this service is currently offered")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Teeth Whitening",
                "description": "Professional in-office whitening treatment.",
                "price": "$450",
                "is_active": True
            }
        }


class ServiceUpdateRequest(BaseModel):
    """Model for updating an existing service."""
    name: Optional[str] = Field(default=None)
    description: Optional[str] = Field(default=None)
    price: Optional[str] = Field(default=None)
    is_active: Optional[bool] = Field(default=None)


class HoursModel(BaseModel):
    """Model for clinic opening hours."""
    monday: str = Field(default="9:00 AM - 6:00 PM")
    tuesday: str = Field(default="9:00 AM - 6:00 PM")
    wednesday: str = Field(default="9:00 AM - 6:00 PM")
    thursday: str = Field(default="9:00 AM - 8:00 PM")
    friday: str = Field(default="9:00 AM - 5:00 PM")
    saturday: str = Field(default="10:00 AM - 2:00 PM")
    sunday: str = Field(default="Closed")


class FAQModel(BaseModel):
    """Model for a single FAQ item."""
    id: Optional[str] = Field(default=None)
    question: str = Field(min_length=1)
    answer: str = Field(min_length=1)