from fastapi import Request, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from aiogram import Bot, Dispatcher
from model_db.main_model import User

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

def get_user(
        user_id:int = Query(...),
        db:Session = Depends(get_db)
):
    
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=406, detail=f"Отсутствует пользователь с id {user_id}")
    return user
def require_admin(admin_id = Query(...),
                  session:Session = Depends(get_db)
                  ):
    
    admin = session.get(User, admin_id)
    if not admin:
        raise HTTPException(status_code=401, detail=f"Пользователя с id {admin_id} - не существует")
    if admin.role != 1:
        raise HTTPException(status_code=406, detail=f"Пользователь не является админом")
    return {"status":"ok"}
