from decimal import Decimal
from model_db.main_model import Booking, PriceGrid
from datetime import datetime, timedelta, time, date
from Settings import settings

def get_remind_at(booking:Booking, minutes_before:int)->datetime:
    dateBook = datetime.fromisoformat(booking.date)
    startDt = datetime.combine(dateBook, booking.start_time, tzinfo=settings.tzInfo)
    return startDt - timedelta(minutes=minutes_before)

def calc_fee(start:time, end:time,is_trainer:bool, grids:list[PriceGrid])->float:
    # базовая валидация (если у тебя брони не переходят через полночь)
    if end <= start:
        raise ValueError("end must be greater than start (same-day booking expected)")

    base_day = date.today()
    booking_start = datetime.combine(base_day, start)
    booking_end = datetime.combine(base_day, end)

    total = Decimal("0")

    # желательно, чтобы grids были отсортированы по time_start
    for grid in grids:
        g_start = datetime.combine(base_day, grid.time_start)
        g_end = datetime.combine(base_day, grid.time_end)

        overlap_start = max(booking_start, g_start)
        overlap_end = min(booking_end, g_end)

        if overlap_start >= overlap_end:
            continue  # пересечения нет

        hours = Decimal((overlap_end - overlap_start).total_seconds()) / Decimal(3600)
        price_per_hour = Decimal(grid.price_trainer if is_trainer else grid.price)

        total += hours * price_per_hour

    # округление в конце (а не на каждом шаге) — обычно корректнее для денег
    return float(total.quantize(Decimal("0.01")))