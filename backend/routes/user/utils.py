from model_db.main_model import Booking
from datetime import datetime, timedelta, time
from Settings import settings

def get_remind_at(booking:Booking, minutes_before:int)->datetime:
    dateBook = datetime.fromisoformat(booking.date)
    startDt = datetime.combine(dateBook, booking.start_time, tzinfo=settings.tzInfo)
    return startDt - timedelta(minutes=minutes_before)

def calc_fee(start:time, end:time, cost_of_hour:float)->float:
    dt_1 = datetime.combine(datetime.today(), start)
    dt_2 = datetime.combine(datetime.today(), end)
    delta_hours = (dt_2-dt_1).total_seconds() / 3600
    return delta_hours * cost_of_hour