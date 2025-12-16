from datetime import date
import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from fapi_dependency import get_db
from logger.logging import get_logger
from model_db.main_model import  Court
from routes.share.schemas import TgUserInfo
from routes.share.services import get_or_create_user, get_time_slots
from schemas.main_schemes import  CourtOut, TimeSlots, UserOut

logger = get_logger("routes.share.router")
router = APIRouter(prefix="", tags=["Общее API"])

@router.get("/courts/info", response_model=CourtOut)
def get_court_info(
    court_id:int = Query(...),
    session:Session = Depends(get_db)
):
    try:
        court = session.execute(select(Court).options(selectinload(Court.grids)).where(Court.id == court_id)).scalar_one_or_none()
        return court
    except Exception as e:
        logger.info("Не удалось получить данные о корте %d", court_id)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/courts/all", response_model=List[CourtOut])
def get_all_courts(session:Session = Depends(get_db)):
    try:
        courts = session.execute(select(Court)).scalars().all()
        return list(courts)
    except Exception as e:
        logger.info("Оштбка получения кортов. %s", str(e))
        raise HTTPException(status_code=500, detail=f"Не удалось получить информацию о кортах")
@router.get("/booked_slots", response_model=TimeSlots)
def get_booked_slots(
    date:date = Query( default= datetime.date.today()),
    court_id:int|None = Query(default=None),
    session:Session = Depends(get_db)
):
    try:
       return get_time_slots(date, session, court_id)
    except Exception as e:
        logger.info("Не удалось получить свободное время на площадке. %s", e)
        raise HTTPException(detail=str(e), status_code=500)

@router.post("/tg_user", response_model=UserOut)
def add_or_update_user(payload:TgUserInfo,
                       session:Session = Depends(get_db)):
    try:
        return get_or_create_user(payload, session)
    except Exception as e:
        logger.info("Не удалось добавить пользователя. %s", e)
        raise HTTPException(detail=str(e), status_code=500)