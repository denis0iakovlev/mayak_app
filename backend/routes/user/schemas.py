from pydantic import BaseModel
from datetime import date, time

class ChangeStatusBookingPayload(BaseModel):
    booking_id:int
    new_status:int

class BookingCreatePayload(BaseModel):
    dateBooking: date
    start_time: time
    end_time: time
    court_id: int