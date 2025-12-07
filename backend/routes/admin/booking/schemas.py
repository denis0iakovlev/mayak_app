from pydantic import BaseModel
from schemas.main_schemes import BookingOut, UserOut
#
class UpdateBookingByAdmin(BaseModel):
    status: int |None = None
    fee:float|None = None
    court_id:int|None = None
#
class AdminBookingOut(BookingOut):
    user:UserOut
    class Config:
        from_attributes = True