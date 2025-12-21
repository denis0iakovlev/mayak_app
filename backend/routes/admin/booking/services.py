from datetime import date
from fastapi import Depends
from sqlalchemy import select
from fapi_dependency import get_scheduler
from logger.logging import get_logger
from model_db.main_model import Booking, User
from routes.admin.booking.schemas import UpdateBookingByAdmin
from sqlalchemy.orm import Session, joinedload
from aiogram import Bot
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from utils.notify_utils import notify_cancel_booking
logger = get_logger("routes.admin.booking.services")
def admin_change_booking(session:Session,bot:Bot, booking_id:int,payload: UpdateBookingByAdmin, scheduler:AsyncIOScheduler)->Booking:
    try:
        booking = session.get(Booking,booking_id)
        if booking is None:
            raise Exception("Бронирование не найдено")
        only_filled  = payload.model_dump(exclude_none=True)
        if not only_filled:
            return booking
        for k, v in only_filled.items():
            setattr(booking, k, v)
        if booking.status == 3:
            session.delete(booking)
            session.commit()
            msg = f"Ваше бронирование отменено админом."
            notify_cancel_booking(booking=booking, bot=bot, scheduler=scheduler, msg=msg, session=session)
            return booking
        session.commit()
        session.refresh(booking)
        return booking
    except Exception as e:
        raise e
def get_all_bookings_by_date(targetDate:date, session:Session):
    try:
        stmt = select(Booking).options(joinedload(Booking.user)).where(Booking.date == targetDate).order_by(Booking.start_time.asc())
        bookings = session.execute(stmt).scalars().all()
        return list(bookings)
    except Exception as e:
        logger.info("Не удалось получить все бронирования на дату %s", targetDate.strftime("%Y/%m/%d"))
        raise e