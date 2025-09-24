from fastapi import Request, HTTPException
from sqlalchemy.orm import Session
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from aiogram import Bot, Dispatcher

"""
Инжекты для вставки в роутах FastApi
"""
def get_scheduler(request:Request)->AsyncIOScheduler:
    return request.app.state.scheduler

def get_bot(request:Request)->Bot:
    return request.app.state.bot

def get_dispatcher(request:Request)->Dispatcher:
    return request.app.state.dp

def get_db(request:Request):
    SessionLocal = request.app.state.sessionmaker
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        print(str(e))
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
def get_session_maker(request:Request):
    return request.app.state.sessionmaker

def get_async_sessionmaker(request:Request):
    return request.app.state.async_sessionmaker