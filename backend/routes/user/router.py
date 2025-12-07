from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from utils.db_utils import get_user
from fapi_dependency import get_bot, get_scheduler, get_db
from model_db.main_model import Booking
from schemas.main_schemes import BookingOut
from aiogram import Bot
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from logger.logging import get_logger
from routes.user.schemas import BookingCreatePayload, ChangeStatusBookingPayload
from routes.user.services import create_booking, change_booking_status
import json

logger = get_logger("route.user.route")
router = APIRouter(prefix="/user", tags=["Функции пользователя"] )
#Создать бронирование
@router.post("/{user_id}/booking/add", response_model=BookingOut)
def post_create_booking(user_id=Path(...),
                payload:BookingCreatePayload = Body(),
                   scheduler:AsyncIOScheduler = Depends(get_scheduler),
                   bot:Bot =  Depends(get_bot),
                   db:Session = Depends(get_db)
                   ):
    #Найти пользователя 
    #logger.info("Создаем бронирование\n Параметры: \n %s",json.dumps(payload.model_dump(), indent=2, ensure_ascii=True))
    try:
        new_book =  create_booking(user_id=user_id, payload=payload, bot=bot,session=db, scheduler=scheduler)
        return new_book
    except Exception as e:
        return HTTPException(status_code=410, detail=str(e), headers={"error_msg": "Не удалось забронировать время"})
#Получить все бронирования для определенного юзера 
@router.get("/{user_id}/bookings")
def get_bookings_with_status(
        user_id:int = Path(...),
        status:int =  Query(...),
        db:Session = Depends(get_db)
    ): 
    try:
        if status not in [0,1,2,3,4]:
            return HTTPException(status_code=404, detail="Передан не правильный статус")
        user = get_user(telegram_id=user_id, db=db)
        stmt = select(Booking).options(joinedload(Booking.court)).where(Booking.user_id == user_id, Booking.status == status ).order_by(Booking.date.asc(), Booking.start_time.asc())
        bookings = db.execute(stmt).scalars().all()
        return list(bookings)
    except Exception as e:
        return HTTPException(status_code=500, detail=e)
#Удалить бронирование у определенного пользователя
@router.patch("/{user_id}/booking")
def change_status_user_booking(
    user_id:int=Path(...),
    payload:ChangeStatusBookingPayload = Body(...),
    db: Session = Depends(get_db),
    bot:Bot = Depends(get_bot),
    scheduler:AsyncIOScheduler = Depends(get_scheduler)
    ):
    try:
        return change_booking_status(user_id,payload, db, bot, scheduler)
    except HTTPException as e:
        return e
    except Exception as e:
        return HTTPException(status_code=530, detail=f"Не удалось удалить бронирование. {str(e)}")
#Получить роль пользователя
@router.get("/{user_id}/role")
def get_user_role(
    user_id:int = Path(...),
    db:Session=Depends(get_db)
):
    try:
        user = get_user(user_id, db)
        return {"role": user.role, "roleName": "Админ" if user.role == 1 else "Любитель"}
    except Exception as e:
        return HTTPException(status_code=500, detail=str(e))
