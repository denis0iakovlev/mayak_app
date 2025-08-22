from fastapi import FastAPI, HTTPException, Query, Depends, Request
from utils.db_model import Court, User, Booking
from typing import List, Optional
from sqlalchemy.orm import Session
from utils.db_utils import get_db, get_user
from utils.srv_schemas import CourtOut, SlotResponse, BookedSlot, UserOut
from pydantic import BaseModel
from routes.admin_route import router as admin_routes
from routes.user_router import router as user_routes
from fastapi.middleware.cors import CORSMiddleware
from aiogram import Bot
from contextlib import asynccontextmanager
import os
from utils.scheduler.scheduler import create_scheduler, registry_job
from utils.scheduler.jobs import make_change_status_job_spec
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.client.telegram import TEST
from Settings import settings
from dotenv import load_dotenv
load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")

@asynccontextmanager
async def lifespan(app:FastAPI):
    print("FastApi сервис поднят !!!")
    if settings.mode == 'dev':
        session = AiohttpSession(api=TEST)
        app.state.bot = Bot(settings.bot_token_test, session=session)
        print("Тестовый бот инициализирован")
    else:
        app.state.bot = Bot(settings.bot_token)
        print("Продуктовый бот инициализирован")
    app.state.scheduler = create_scheduler()
    registry_job(app.state.scheduler, job= make_change_status_job_spec())
    app.state.scheduler.start()

    try:
        yield
    finally:
        # shutdown
        app.state.scheduler.shutdown(wait=False)
        # тут теперь МОЖНО await — мы в async-контексте
        await app.state.bot.session.close()

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
#Добадение роутов
app.include_router(admin_routes)
app.include_router(user_routes)
#События

#Получить данные о корте
@app.get("/courts/info")
def get_court_info(court_id:int = Query(...), db:Session = Depends(get_db)):
    court = db.query(Court).filter(Court.id == court_id).first()
    if not court:
        raise HTTPException(status_code=503, detail=f"Корта с id {court_id} - не существует")
    return court
#Забронировать время на корте
@app.get("/courts/all", response_model=List[CourtOut])
def get_courts_list(db:Session = Depends(get_db)):
    courts_list = db.query(Court).all()
    return [CourtOut(id= c.id, name = c.name, description=c.description, is_active= c.is_active  ) for c in courts_list]
#Получить бронирование на определенном корте
@app.get("/booking", response_model= SlotResponse)
def get_occuped_data(
    date:str = Query(..., regex="^\d{4}-\d{2}-\d{2}$"),
    court_id:int = Query(...),
    db:Session = Depends(get_db)
):
    bookings = db.query(Booking).filter(Booking.date == date, Booking.court_id == court_id, Booking.status != 3).all()
    booking_slot = [BookedSlot(booked_start= b.start_time.strftime("%H:%M"), booked_end = b.end_time.strftime("%H:%M")) for b in bookings]
    return SlotResponse(
        booked_slots=booking_slot,
        court_id=court_id,
        date=date
    )
#Добавить пользователя в БД
class UserReq (BaseModel):
    telegram_id:int 
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None

@app.post("/check_user", response_model=UserOut)
def addUser(
    payload:UserReq,
    db:Session = Depends(get_db)
):
    user = None
    try:
        user = get_user(payload.telegram_id, db)
    except Exception as e:
        user = User(
                telegram_id=payload.telegram_id,
                first_name=payload.first_name,
                last_name=payload.last_name,
                username=payload.username,
            )
        db.add(user)
        db.commit()
        db.refresh(user)
    finally:
        if not user:
            return HTTPException(status_code=500, detail="Неудалось зарегистрировать пользователя")
        return UserOut(
            telegram_id=user.telegram_id,
            role= "Админ" if user.role == 1 else "Любитель",
            created_at=user.created_at.strftime("%Y-%m-%d"),
            first_name=user.first_name,
            is_trainer= user.is_trainer if  user.is_trainer else False,
            last_name=user.last_name,
            phone_number=user.phone_number,
            username=user.username,
        )    
    

