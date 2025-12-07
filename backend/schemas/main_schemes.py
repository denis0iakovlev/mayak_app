# schemas.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import time, date, datetime

class BookedSlot(BaseModel):
    booked_start:str
    booked_end:str

class TimeSlots(BaseModel):
    date:str
    court_id:int|None = None
    booked_slots:List[BookedSlot]

class CourtOut(BaseModel):
    id: int
    name: str
    description:str
    is_active:bool
    class Config:
        from_attributes = True

class BookingOut(BaseModel):
    id: int
    date: str
    start_time: time
    end_time: time
    status: int
    fee:float
    signCancel:Optional[int]
    court_id: int
    court:CourtOut
    user_id: int
    class Config:
        from_attributes = True


class UserOut(BaseModel):
    telegram_id: int
    first_name: str
    last_name: Optional[str]
    phone_number:Optional[str]
    username: Optional[str]
    role: Optional[int]
    is_trainer:bool
    created_at:Optional[datetime]
    class Config:
        from_attributes = True
#Admin court schema

class CreateCourtPayload(BaseModel):
    admin_id:int
    name:str
    description:str | None = "Теннисный корт"
    is_active:bool | None = None

#
class UserRoleUpdate(BaseModel):
    admin_telegram_id:int
    user_telegram_id:int
    new_role:int
#
class UpdateUserRoleResponse(BaseModel):
    update_id:int
    new_role:str