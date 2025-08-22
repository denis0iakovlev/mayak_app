from  dotenv import load_dotenv
import os
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy import create_engine
from utils.db_model import Base, User, Booking
from fastapi import HTTPException
from typing import List

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data.db")
#Создаем движок и сессию к базе данных
engine =create_engine(DATABASE_URL, connect_args={"check_same_thread":False}
                    if DATABASE_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
#Создаем таблицу
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        print(str(e))
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

def get_user(telegram_id:int, db:Session)->User:
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        raise Exception("В БД отсутствует пользователем с переданным id")
    return user
def get_booking(booking_id, db:Session)->Booking:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise Exception("В БД отсутствует бронирование")
    return booking
def get_admins(db:Session)->List[User]:
    admins = db.query(User).filter(User.role == 1).all()
    return admins