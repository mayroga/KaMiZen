from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: str

class MicroActionCreate(BaseModel):
    user_id: int
    action: str
    scheduled_at: datetime
