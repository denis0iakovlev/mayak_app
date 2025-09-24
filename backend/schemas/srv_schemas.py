# schemas.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import time, date, datetime

class BookedSlot(BaseModel):
    booked_start:str
    booked_end:str

class SlotResponse(BaseModel):
    date:str
    court_id:int
    booked_slots:List[BookedSlot]

class CourtOut(BaseModel):
    id: int
    name: str
    description:str
    is_active:bool
    class Config:
        orm_mode = True

class BookingOut(BaseModel):
    id: int
    dateBooking: str
    start_time: time
    end_time: time
    fee:int
    court_id: int
    court_name:str
    user_id: int
    status: int
    class Config:
        orm_mode = True


class UserOut(BaseModel):
    telegram_id: int
    first_name: str
    last_name: Optional[str]
    username: Optional[str]
    phone_number:Optional[str]
    created_at:Optional[str]
    role: Optional[str]
    is_trainer:bool

    class Config:
        orm_mode = True


class CourtCreateUpdate(BaseModel):
    admin_id:int
    name:str
    description:Optional[str] = "Теннисный корт"
    isActive:Optional[bool] = True

class CourtUpadte(BaseModel):
    id:int
    name:Optional[str]
    description:Optional[str]
    isActive:Optional[bool]
#
class UserRoleUpdate(BaseModel):
    admin_telegram_id:int
    user_telegram_id:int
    new_role:int
#
class UpdateUserRoleResponse(BaseModel):
    update_id:int
    new_role:str
