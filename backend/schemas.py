from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
import uuid

# User Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    tier: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Health Log Schemas
class HealthLogCreate(BaseModel):
    data_source: str
    metric_type: str
    value: float

class HealthLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    data_source: str
    metric_type: str
    value: float
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Chat Schemas
class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    id: uuid.UUID
    sender: str
    message_text: str
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Wearable Schemas
class WearableConnect(BaseModel):
    wearable_type: str  # 'apple_health', 'oura', 'garmin', 'whoop', 'google_fit'

class WearableResponse(BaseModel):
    id: uuid.UUID
    wearable_type: str
    connected_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

# Product Schemas
class ProductResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    short_description: Optional[str]
    image_url: Optional[str]
    price: float
    category: str
    partner_url: str
    is_vetted: bool
    
    class Config:
        from_attributes = True

# Tier Update Schema
class TierUpdate(BaseModel):
    new_tier: str  # 'connect' or 'baseline'

# Dashboard Schema
class DashboardData(BaseModel):
    user: UserResponse
    recent_logs: List[HealthLogResponse]
    connected_wearables: List[WearableResponse]
    insights: dict
