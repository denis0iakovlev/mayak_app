from fastapi import APIRouter, Depends, HTTPException, Query, Body
from db.utils import get_user, get_booking, get_admin_user
from fapi_dependency import get_db
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import joinedload
from db.main_model import User, Court, Booking, ChatToPublic
from schemas.main_schemes import CreateCourtPayload, UserOut, UserRoleUpdate, UpdateUserRoleResponse, BookingOut, ChatToPosting
from typing import List,Optional
from pydantic import BaseModel
from datetime import date
import phonenumbers
from routes.admin.admin_court import router as court_router;

class AdminBase(BaseModel):
    admin_id:int

router = APIRouter(prefix="/admin", tags=["Admin"])

#Получить всех пользователей
@router.get("/user/all", response_model=List[UserOut])
def get_all_users(admin_id:int = Query(...),db:Session = Depends(get_db)):
    try:
        get_admin_user(admin_id, db)
        users = db.execute(select(User)).scalars().all()
        return list(users)
    except Exception as e:
        raise HTTPException(status_code=501, detail=e)
#Изменить роль для пользователя
@router.patch("/user/role", response_model=UpdateUserRoleResponse)
def updateRole(
    payload:UserRoleUpdate,
    db:Session = Depends(get_db)
):
    try:
        # Исправить на админа 
        admin = get_user(payload.admin_telegram_id, db)
        user = get_user(payload.user_telegram_id, db=db)
        user.role = payload.new_role
        db.commit()
        db.refresh(user)
        return UpdateUserRoleResponse(update_id=payload.user_telegram_id, new_role= "Админ" if payload.new_role == 1 else "Пользователь")
    except Exception as e:
        raise HTTPException(status_code=510, detail=str(e))
class UpdateUserDataReq(AdminBase):
    user_id:int
    is_trainer:Optional[bool]
    username:Optional[str]
    phone_number:Optional[str]
    role:Optional[int]
@router.put("/user/update")
def updateTrainerField(payload:UpdateUserDataReq, db:Session=Depends(get_db)):
    try:
        get_admin_user(payload.admin_id, db)
        user = get_user(payload.user_id, db)
        if payload.is_trainer != None:
            user.is_trainer = payload.is_trainer
        if payload.username:
            user.username = payload.username
        if payload.role: 
            if payload.role in [0,1,2]:
                user.role = payload.role
            else:
                raise Exception("Не верная роль роль может принимать значение 0, 1 или 2")
        if payload.phone_number:
            parsed = phonenumbers.parse(payload.phone_number, "RU")
            if phonenumbers.is_valid_number(parsed):
                user.phone_number = payload.phone_number
            else:
                raise Exception("Номер телефона задан не верно")
        print(f"User {user.telegram_id} now is trainer")
        db.commit()
    except Exception as e:
        raise HTTPException(status_code=510, detail=str(e))

#Удалить пользователя
class DeleteUserReq(AdminBase):
    user_id:int
@router.delete("/user/delete")
def deleteUser(payload:DeleteUserReq, db:Session = Depends(get_db)):
    try:
        admin = get_admin_user(payload.admin_id, db=db)
        userWithBookings = db.query(User).filter(User.telegram_id == payload.user_id).first()
        if not userWithBookings:
            return HTTPException(status_code=404, detail="Такого пользователя нет в БД")
        for book in userWithBookings.bookings:
            db.delete(book)
        db.delete(userWithBookings)
        db.commit()
        return {"status":"ok", "detail":f"Пользователь {payload.user_id} - удален"}
    except Exception as e:
        return HTTPException(status_code=510, detail=str(e))

#Удалить бронирование 
class NewBookStatusReq(BaseModel):
    admin_id:int
    booking_id:int
    new_status:int

@router.patch("/booking/change_status")
def delete_booking(payload:NewBookStatusReq, db:Session = Depends(get_db)):
    try:
        get_admin_user(payload.admin_id, db)
        booking = db.query(Booking).filter_by(id = payload.booking_id).first()
        if not booking:
            raise HTTPException(status_code=505, detail="Не удалось найти в БД соответсвующее бронирование")
        booking.status = payload.new_status
        if payload.new_status == 3:
            db.delete(booking)
        db.commit()
        return {"status":"ok", "detail":"Статус бронирования изменен"}
    except Exception as e:
        return HTTPException(status_code=500, detail=f"Не удалось удалить бронирование.Текст ошибки: {str(e)}")
class ChangeCourtReq(AdminBase):
    booking_id:int
    court_id:int
@router.patch("/booking/change_court")
def change_court(payload:ChangeCourtReq, db:Session=Depends(get_db)):
    try:
        get_admin_user(payload.admin_id, db)
        change_book = db.query(Booking).filter(Booking.id == payload.booking_id).first()
        if not change_book:
            raise Exception(f"Нет бронирования с id {payload.booking_id}")
        court = db.query(Court).filter(Court.id== payload.court_id).first()
        if not court:
            raise Exception(f"Нет корта с id {payload.id}")
        change_book.court = court
        db.commit()
        return {"status":"ok", "detail":"Корт бронирования изменен"}
    except Exception as e:
        return HTTPException(status_code=500, detail=f"Не удалось изменить корт для бронирования {e}")
class ChangeBookingPrice(AdminBase):
    booking_id:int
    price:int
@router.patch("/booking/change_price")
def change_booking_price(payload:ChangeBookingPrice, db:Session=Depends(get_db)):
    try:
        get_admin_user(payload.admin_id, db)
        booking = get_booking(payload.booking_id, db)
        booking.fee = payload.price
        db.commit()   
    except Exception as e:
        return HTTPException(status_code=500, detail=f"Не удалось изменить корт для бронирования {e}")

#Получить все бронирования
# Данные ответа
class AdminBookingOut(BookingOut):
    user:UserOut
    class Config:
        from_attributes = True
@router.get("/booking/all", response_model=list[AdminBookingOut])
def get_all_booking(
    admin_id:int = Query(...),
    targetDate:date = Query(format=""),
    db:Session = Depends(get_db)
):
    try:
        get_admin_user(admin_id, db)
        stmt = select(Booking).options(
            joinedload(Booking.court),
            joinedload(Booking.user)
        ).where(Booking.date == targetDate).order_by(Booking.start_time.asc())
        bookings = db.execute(stmt).scalars().all()
        return list(bookings)
    except Exception as e:
        return HTTPException(status_code=500,detail=f"Не удалось получить бронирования на {targetDate.isoformat()}")
    
@router.get("/postingchats", response_model=list[ChatToPosting])
def post_in_gtoup(
    admin_id:int = Query(...),
    db:Session = Depends(get_db)
    ):
    try:
        admin = get_admin_user(admin_id, db)
        res = db.execute(select(ChatToPublic)).scalars().all()
        return list(res)
    except Exception as e:
        return HTTPException(status_code=500, detail=f"{str(e)}")
@router.delete("/postingchats")
def delete_chat(admin_id:int=Query(...),
                chat_id:int=Query(...),
                db:Session = Depends(get_db)):
    try:
        admin = get_admin_user(admin_id, db)
        chat = db.get(ChatToPublic, chat_id)
        if chat is None:
            raise Exception(f"Отсутсвует чат с id {chat_id}")
        db.delete(chat)
        return {"detail": "Чат для постинга расписания удален"}
    except Exception as e:
        return HTTPException(status_code=500, detail=f"{str(e)}")