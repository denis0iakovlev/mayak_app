from fastapi import APIRouter, Depends, HTTPException, Query, Path
from utils.db_utils import get_db, get_user, get_booking
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from utils.db_model import User, Court, Booking
from utils.srv_schemas import CourtCreateUpdate, UserOut,CourtOut, UserRoleUpdate, UpdateUserRoleResponse, BookingOut
from typing import List, Literal, Optional
from pydantic import BaseModel
from datetime import date, time, datetime
import phonenumbers

class AdminBase(BaseModel):
    admin_id:int

router = APIRouter(prefix="/admin", tags=["Admin"])

def get_admin_user(
        telegram_id:int,
        db:Session = Depends(get_db)
)->User:
    admin_user = get_user(telegram_id=telegram_id, db=db)
    if admin_user.role != 1:
        raise Exception(f"Пользователь не является админом")
    return admin_user
#Добавить новый корт в БД
@router.post("/court/add")
def add_new_court(
    payload:CourtCreateUpdate,
    db:Session = Depends(get_db)     
    ):
    court = Court(
        name=payload.name,
        description=payload.description,
        is_active=payload.isActive
    )
    db.add(court)
    db.commit()
    db.refresh
    return {"status":"ok", "detail":"Корт был добавлен"}
#Закрыть корт и удалить все бронирования
# Close court request
class CloseCourtReq(BaseModel):
    court_id:int
    admin_id:int
    target_date:date
    start_time:time
    end_time:time
@router.patch("/court/close")
def closeCourt(
    payload:CloseCourtReq,
    db:Session = Depends(get_db),
):
    try:
        admin_user = get_admin_user(payload.admin_id, db)
        court = db.query(Court).filter(Court.id == payload.court_id).first()
        if not court:
            raise Exception(f"Нет корта с id {payload.court_id}")
        bookings_to_delete = db.query(Booking).filter(Booking.court_id == payload.court_id,
                                                      Booking.date == payload.target_date,
                                                      or_(
                                                          and_(
                                                              Booking.start_time >= payload.start_time,
                                                              Booking.end_time <=payload.end_time
                                                              ),
                                                              and_(
                                                                  Booking.start_time <= payload.end_time,
                                                                  Booking.end_time >= payload.start_time
                                                              )
                                                      )
                                                      ).all()
        count = len(bookings_to_delete)
        for book in bookings_to_delete:
            db.delete(book)
        court.is_active = False
        court.reactivate_at = datetime.combine(payload.target_date, payload.end_time)
        db.commit()
        db.refresh(court)
        return {"status":"ok", "detail":f"Удалено {count} записей на {payload.target_date} с {payload.start_time} по {payload.end_time}"}
    except Exception as e:
        return HTTPException(status_code=510, detail=str(e))

#Удалить корт из БД
@router.delete("/court")
def delete_court(admin_id:int= Query(...), court_id:int = Query(...), db:Session = Depends(get_db)):
    try:
        admin = get_admin_user(admin_id, db)
        court = db.query(Court).filter_by(id = court_id).first()
        if not court:
            raise HTTPException(status_code=504, detail="В БД нет корта с переданным id")
        db.delete(court)
        db.commit()
        db.refresh()
        return {"status": "ok", "detail": "Корт был удален"}
    except Exception as e:
         return HTTPException(status_code=510, detail=f"Не удалось удалить корт из БД.Текст ошибки: {str(e)}")
#Получить всех пользователей
@router.get("/user/all", response_model=List[UserOut])
def get_all_users(admin_id:int = Query(...),db:Session = Depends(get_db)):
    try:
        get_admin_user(admin_id, db)
        users = db.query(User).all()
        result = [UserOut(
            telegram_id=c.telegram_id,
            last_name=c.last_name,
            created_at=c.created_at.strftime("%Y-%m-%d"),
            phone_number=c.phone_number,
            role= "Админ" if c.role == 1 else "Любитель",
            first_name=c.first_name,
            username=c.username,
            is_trainer=c.is_trainer if c.is_trainer  else False
        ) for c in users]
        return result
    except Exception as e:
        raise HTTPException(status_code=501, detail="Ошибка с БД")
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
@router.get("/booking/all", response_model=List[AdminBookingOut])
def get_all_booking(
    admin_id:int = Query(...),
    targetDate:date = Query(format=""),
    db:Session = Depends(get_db)
):
    try:
        get_admin_user(admin_id, db)
        queryRes = db.query(Booking, User,Court.name).filter(Booking.user_id == User.telegram_id,Booking.court_id == Court.id,  Booking.date==targetDate).all()
        res = []
        for (book, bookUser, bookCourt) in queryRes:
            res.append(AdminBookingOut(
                court_id=book.court_id,
                id=book.id,
                dateBooking=book.date,
                start_time=book.start_time,
                end_time=book.end_time,
                user_id=book.user_id,
                court_name = bookCourt,
                status= book.status,
                fee=round(book.fee) if book.fee else 0,
                user= UserOut(
                    telegram_id=bookUser.telegram_id,
                    created_at=bookUser.created_at.strftime("%Y-%m-%d"),
                    first_name=bookUser.first_name,
                    last_name=bookUser.last_name,
                    username = bookUser.username,
                    role= "Админ" if bookUser.role == 1 else "Любитель",
                    phone_number=bookUser.phone_number,
                    is_trainer=bookUser.is_trainer if bookUser.is_trainer else False
                )
            ))
        return res
    except Exception as e:
        return HTTPException(status_code=500,detail=f"Не удалось получить бронирования на {targetDate.isoformat()}")