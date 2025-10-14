from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from db.utils import get_user, get_admins, get_bookings_last_5_days
from fapi_dependency import get_bot, get_scheduler, get_db, get_session_maker
from db.main_model import Booking, Court, ChatToPublic
from schemas.srv_schemas import BookingOut
from datetime import date, time, datetime
from pydantic import BaseModel 
from bot.sendMsg import send_text, notify_users, update_message_in_groups
from scheduler.jobs import make_reminder_job_spec
from aiogram import Bot
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from Settings import settings
from logger.logging import get_logger
from bot.msg_creator import create_booking_msg
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

logger = get_logger("route.user")

class UserReq(BaseModel):
    user_id:int

router = APIRouter(prefix="/user", tags=["User"] )

class BookingCreate(UserReq):
    date: date
    start_time: time
    end_time: time
    court_id: int
@router.post("/booking/add", response_model=BookingOut)
def create_booking(payload:BookingCreate,
                   scheduler:AsyncIOScheduler = Depends(get_scheduler),
                   bot:Bot =  Depends(get_bot),
                   db:Session = Depends(get_db)
                   ):
    #Найти пользователя 
    print("Бронирование")
    try:
        user = get_user(payload.user_id, db)
        #Проверить что время свободно
        exists = db.query(Booking).filter(
            Booking.date == payload.date.isoformat(),
            Booking.court_id == payload.court_id,
            Booking.start_time < payload.end_time,
            Booking.end_time > payload.start_time,
            Booking.status == 0
        ).first()
        if exists:
            raise Exception("Время занято")
        #посчитать стоимость бронирования
        dtstart = datetime.combine(datetime.today(), payload.start_time)
        dtend = datetime.combine(datetime.today(), payload.end_time)
        delta = dtend - dtstart
        hour = delta.total_seconds() / (60*60)
        fee = 0
        border = datetime.combine(datetime.today(), time(17,0))
        if (user.is_trainer):
            fee = hour * 500
        elif dtend > border :
            if dtstart < border:
                deltaBefore = border - dtstart
                hourBefore = deltaBefore.total_seconds() / (60*60)
                deltaAfter = dtend - border
                hourAfter = deltaAfter.total_seconds() / (60*60)
                fee = hourBefore * 800 + hourAfter*1000
            else:
                fee = hour * 1000
        else:
            fee = hour * 800
        logger.info("booking %s from %s to %s cost %d", payload.date,payload.start_time, payload.end_time, fee )
        # Создать бронь
        booking = Booking(
            date=payload.date,
            start_time=payload.start_time,
            end_time=payload.end_time,
            court_id=payload.court_id,
            user_id=user.telegram_id,
            fee=fee,
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)
        stmt = select(Booking).options(
            joinedload(Booking.court)
        ).where(
            Booking.id == booking.id 
        )
        res = db.execute(stmt).scalars().first()
        #отправить всем админам сообщение о новом бронировании
        reminder_job = make_reminder_job_spec(booking=res, bot=bot)
        if reminder_job != None :
            scheduler.add_job(**reminder_job.as_add_job_kwargs())
            logger.info("Добавлен подзадача по напоминанию по бронированию %d",booking.id)
        admin_msg = f'Пользователь {user.first_name} забронировал корт {booking.court_id} на {payload.date.strftime("%d/%m/%Y")} \nВремя: {payload.start_time.strftime("%H:%M")} - {payload.end_time.strftime("%H:%M")}.\n Телефон: {user.phone_number}'
        #Оповестить админов о том что кто-то забронировал время
        admins = get_admins(db)
        notify_users(bot=bot, text=admin_msg, user_ids =  [ad.telegram_id for ad in admins])
        #Отправить сообщение пользователю что он забронировал время
        send_text(bot=bot, chat_id=user.telegram_id,text = f'Вы забронировали корт {booking.court_id} на {booking.date}\n Время: {payload.start_time.strftime("%H:%M")} - {payload.end_time.strftime("%H:%M")}')
        #Обновить/создать сообщение в общей группе с перечислением бронирований
        #Получить все группы в которые необходимо постить сообщения
        update_message_in_groups(bot=bot, db=db)
        return booking
    except Exception as e:
        return HTTPException(status_code=410, detail=str(e), headers={"error_msg": "Не удалось забронировать время"})
#Получить все бронирования для определенного юзера 
@router.get("/booking")
def get_bookings_with_status(
        user_id:int = Query(...),
        status:int =  Query(...),
        db:Session = Depends(get_db)
    ): 
    try:
        if status not in [0,1,2,3,4]:
            return HTTPException(status_code=404, detail="Передан не правильный статус")
        user = get_user(user_id, db)
        stmt = select(Booking).options(joinedload(Booking.court)).where(Booking.user_id == user_id, Booking.status == status ).order_by(Booking.date.asc(), Booking.start_time.asc())
        bookings = db.execute(stmt).scalars().all()
        return list(bookings)
    except Exception as e:
        return HTTPException(status_code=500, detail=e)
#Удалить бронирование у определенного пользователя
class DeleteRequest(UserReq):
    user_id:int
    booking_id:int
    new_status:int
@router.patch("/booking/change_status")
def change_status_user_booking(
    payload:DeleteRequest,
    db: Session = Depends(get_db),
    bot:Bot = Depends(get_bot)
    ):
    try:
        user = get_user(payload.user_id,db)
        booking = db.query(Booking).filter(Booking.id == payload.booking_id, Booking.user_id == user.telegram_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if payload.new_status == 3:
            #Оповестить админов о снятии брони
            msg = f'{user.first_name} - отменил бронирование на {booking.date} \nВремя: {booking.start_time.strftime("%H:%M")}-{booking.end_time.strftime("%H:%M")}'
            admins = get_admins(db)
            notify_users(bot, msg, [usr.telegram_id for usr in admins])
            db.delete(booking)
        else:
            booking.status = payload.new_status
        db.commit()
        if payload.new_status == 3:
            update_message_in_groups(bot=bot, db=db)
        return {"status": "ok", "detail": "Статус изменен успешно"}
    except HTTPException as e:
        return e
    except Exception as e:
        return HTTPException(status_code=530, detail=f"Не удалось удалить бронирование. {str(e)}")
    
@router.get("/role")
def get_user_role(
    user_id:int = Query(...),
    db:Session=Depends(get_db)
):
    try:
        user = get_user(user_id, db)
        return {"role": user.role, "roleName": "Админ" if user.role == 1 else "Любитель"}
    except Exception as e:
        return HTTPException(status_code=500, detail=str(e))
