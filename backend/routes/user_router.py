from fastapi import APIRouter, Depends, HTTPException, Query, Path, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from utils.db_utils import get_db, get_user, get_admins
from utils.db_model import User, Booking, Court
from utils.srv_schemas import BookingOut
from typing import List, Optional
from datetime import date, time, datetime
from  pydantic import BaseModel 
from aiogram import Bot
from utils.bot.sendMsg import send_text, notify_users
from apscheduler.schedulers.background import BackgroundScheduler
from utils.scheduler.jobs import make_reminder_job_spec

def get_scheduler(request:Request)->BackgroundScheduler:
    return request.app.state.scheduler

def get_bot(request:Request)->Bot:
    return request.app.state.bot

class UserReq(BaseModel):
    user_id:int

router = APIRouter(prefix="/user", tags=["User"] )

class BookingCreate(UserReq):
    date: date
    start_time: time
    end_time: time
    court_id: int
@router.post("/booking/add")
def create_booking(payload:BookingCreate,
                   scheduler:BackgroundScheduler = Depends(get_scheduler),
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
        border = datetime.combine(datetime.today(), time(18,0))
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
        print(f"booking {payload.date} from {payload.start_time} to {payload.end_time} cost {fee}")
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
        #отправить всем админам сообщение о новом бронировании
        startDt = datetime.combine(payload.date, payload.start_time)
        reminder_job = make_reminder_job_spec(booking_id=booking.id, user_chat_id=user.telegram_id, start_at=startDt, bot=bot)
        if reminder_job != None :
            scheduler.add_job(**reminder_job.as_add_job_kwargs())
            print(f"Добавлен подзадача по напоминанию по бронированию {booking.id}")
        admin_msg = f'Пользователь {user.first_name} забронировал корт {booking.court_id} на {payload.date.strftime("%d/%m/%Y")} \nВремя: {payload.start_time.strftime("%H:%M")} - {payload.end_time.strftime("%H:%M")}.\n Телефон: {user.phone_number}'
        admins = get_admins( db)
        notify_users(bot=bot, text=admin_msg, user_ids =  [ad.telegram_id for ad in admins])
        send_text(bot=bot, chat_id=user.telegram_id,text = f'Вы забронировали корт {booking.court_id} на {booking.date}\n Время: {payload.start_time.strftime("%H:%M")} - {payload.end_time.strftime("%H:%M")}')
    except Exception as e:
        return HTTPException(status_code=410, detail=str(e), headers={"error_msg": "Не удалось забронировать время"})
    return {"status": "ok", "booking_id": booking.id}
#Получить все бронирования для определенного юзера 
@router.get("/booking")
def get_all_unpaid_bookings(
        user_id:int = Query(...),
        status:int =  Query(...),
        db:Session = Depends(get_db)
    ): 
    try:
        if status not in [0,1,2,3,4]:
            return HTTPException(status_code=404, detail="Передан не правильный статус")
        user = get_user(user_id, db)
        unpaid_bookings = db.query(Booking, Court.name).filter(Booking.court_id == Court.id, Booking.user_id == user_id, Booking.status == status).order_by(Booking.date.asc(), Booking.start_time.asc()).all()
        res = []
        for (book, courtName) in unpaid_bookings:
            res.append(BookingOut(
                court_id=book.court_id,
                id=book.id,
                dateBooking=book.date,
                start_time=book.start_time,
                end_time=book.end_time,
                fee=book.fee if book.fee else 0,
                court_name=courtName,
                user_id=book.user_id,
                status= book.status
            )) 
        return res
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
            #
            db.delete(booking)
        else:
            booking.status = payload.new_status
        
        db.commit()
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
