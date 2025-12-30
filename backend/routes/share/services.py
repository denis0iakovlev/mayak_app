from datetime import date, time
import json
from sqlalchemy import select
from sqlalchemy.orm import Session

from logger.logging import get_logger
from model_db.main_model import Booking, User
from routes.share.schemas import TgUserInfo
from schemas.main_schemes import BookedSlot, TimeSlots

logger = get_logger("routes.share.services")

def get_time_slots(date:date, session:Session, court_id:int|None = None)->TimeSlots:
    try:
        conditions = [Booking.date == date.isoformat()]
        if court_id is not None:
            conditions.append(Booking.court_id == court_id)
        stmt = select(Booking.start_time, Booking.end_time).where(*conditions)
        time_slots = session.execute(stmt).tuples().all()
        book_slots = [BookedSlot(booked_end=end.isoformat(), booked_start=st.isoformat()) for st, end in time_slots ]
        return TimeSlots(date=date.isoformat(), court_id=court_id, booked_slots=book_slots)
    except Exception as e:
        logger.info("Не удалось получить свободное время на площадке. %s", e)
        raise e
def get_or_create_user(payload:TgUserInfo, session:Session)->User:
    try:
        user = session.get(User,payload.telegram_id)
        if user is None: 
            session.add(payload.to_orm())
            session.commit()
            session.refresh(user)
        return user
    except Exception as e:
        logger.info("Не удалось добавить пользователя. %s", json.dumps(payload.model_dump(), ensure_ascii=True, indent=2))
        raise e