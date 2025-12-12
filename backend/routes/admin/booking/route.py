from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body
from fapi_dependency import get_scheduler, require_admin, get_bot, get_db
from routes.admin.booking.schemas import AdminBookingOut, UpdateBookingByAdmin
from routes.admin.booking.services import admin_change_booking, get_all_bookings_by_date
from aiogram import Bot
from sqlalchemy.orm import Session
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from schemas.main_schemes import BookingOut
router = APIRouter(prefix="/admin/booking", tags=["Управление бронированиями"], dependencies=[Depends(require_admin)])

@router.patch("/{booking_id}", response_model=BookingOut)
def admin_change_booking_endpoints(booking_id:int = Path(...),
                          payload:UpdateBookingByAdmin = Body(...),
                          bot:Bot = Depends(get_bot),
                          session:Session = Depends(get_db),
                          scheduler:AsyncIOScheduler = Depends(get_scheduler)):
    try:
        return admin_change_booking(booking_id=booking_id, payload=payload,bot=bot, session=session, scheduler=scheduler)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Не удалось обновить бронирование. {str(e)}")
    
@router.get("/all", response_model=List[AdminBookingOut])
def get_all_bookings_endpoints(targetDate:date = Query(format=""),
    session:Session = Depends(get_db),
    scheduler:AsyncIOScheduler = Depends(get_scheduler)):
    try:
        return get_all_bookings_by_date(targetDate, session)
    except Exception as e:
        raise HTTPException(status_code=504, detail=f"Не удалось получить бронирования для админа {str(e)}")