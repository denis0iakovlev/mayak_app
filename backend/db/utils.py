from sqlalchemy.orm import Session
from db.main_model import User, Booking, Court
from typing import List
from datetime import  date, timedelta, datetime
from sqlalchemy import select, or_, and_
from sqlalchemy.orm import joinedload
from Settings import settings
from collections import defaultdict

def get_user(telegram_id:int, db:Session)->User:
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        raise Exception("В БД отсутствует пользователем с переданным id")
    return user
def get_booking(booking_id, db:Session)->Booking:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise Exception("В БД отсутствует бронирование")
    return booking
def get_admins(db:Session)->List[User]:
    admins = db.query(User).filter(User.role == 1).all()
    return admins

def get_bookings_last_5_days(db:Session)->dict[str, dict[str:list[Booking]]]:
    now = datetime.now(settings.tzInfo)
    today = now.date()
    end = today + timedelta(days=5)
    start_s = today.isoformat()
    end_s = end.isoformat()
    #Порог для отсечения бронирований которые прошли или начнутся в теченее след пол часа
    threshold = now + timedelta(minutes=1)
    th_time = threshold.time()

    conditions = [
        Booking.date >= start_s,
        Booking.date <= end_s,
        or_(
            Booking.date > start_s,
            and_(
                Booking.date == start_s,
                Booking.start_time >= th_time 
            )
        )
    ]

    stmt = (
        select(Booking)
        .options(
            joinedload(Booking.court),
            joinedload(Booking.user)
        )
        .where(*conditions)
        .order_by(Booking.date, Booking.start_time, Booking.court_id)
    )

    bookings = db.execute(stmt).scalars().all()

    grouped = defaultdict(lambda: defaultdict(list))

    for b in bookings:
        grouped[b.date][b.court.name].append(b)
    
    # Приводим к обычному dict, отсортированному по дате-строке
    return dict(sorted(grouped.items(), key=lambda kv: kv[0]))