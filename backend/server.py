from fastapi import FastAPI, HTTPException, Query, Depends, Request, Header, Response
from db.main_model import Court, User, Booking
from typing import List, Optional
from sqlalchemy.orm import Session
from fapi_dependency import get_db
from db.utils import get_user
from schemas.srv_schemas import CourtOut, SlotResponse, BookedSlot, UserOut
from pydantic import BaseModel
from routes.admin_route import router as admin_routes
from routes.user_router import router as user_routes
from fastapi.middleware.cors import CORSMiddleware
from aiogram.types import Update
from aiogram.methods import TelegramMethod
from contextlib import asynccontextmanager, suppress
import asyncio
from scheduler.scheduler import create_scheduler, registry_job
from scheduler.jobs import make_change_status_job_spec
from aiogram import Bot, Dispatcher
from Settings import settings
from bot.bot_mw import LogContextMiddleware
import uuid
from logger.context import req_id_var
from logger.logging import setup_logging, get_logger
from db.core import create_async, create_sync
from bot.core import create_bot, create_dispatcher, delete_webhook_if_set, start_polling_background, set_webhook
from bot.bot_mw import LogContextMiddleware, DBSessionMiddleWare
from bot.bot_routes import r as main_bot_router
from fapi_dependency import get_bot, get_dispatcher
#Настроить логирование
setup_logging()

logger = get_logger("server.main")

@asynccontextmanager
async def lifespan(app:FastAPI):
    logger.info("Выполняем подготовительную работу перед стартом сервере")
    #Начинаем с установки сессий (асинхронной и синхронной ) к БД
    sync_url = settings.database_url.replace("+aiosqlite", "")
    logger.info("DB connection url sync=%s async=%s", sync_url, settings.database_url)
    app.state.async_engine, app.state.async_sessionmaker = create_async(settings.database_url)
    app.state.engine, app.state.sessionmaker = create_sync(url=sync_url, is_sqlite=sync_url.startswith("sqlite:"))
    # включить WAL для SQLite (рекомендуется)
    if sync_url.startswith("sqlite:"):
        with app.state.engine.begin() as conn:
            conn.exec_driver_sql("PRAGMA journal_mode=WAL;")
            conn.exec_driver_sql("PRAGMA foreign_keys=ON;")
        async with app.state.async_engine.begin() as conn:
            await conn.exec_driver_sql("PRAGMA foreign_keys=ON;")
    
    #Создаем и запихиваем в состояние бот и диспатчер
    app.state.bot = await create_bot() #Бот будет создан или для тестовой среды и для продакшена

    app.state.dp=  create_dispatcher()
    #устанавливаем мидлваре для диспатчера , для логирования и для инжекта 
    app.state.dp.update.middleware(LogContextMiddleware())
    app.state.dp.update.middleware(DBSessionMiddleWare(app.state.async_sessionmaker))
    #Добавляем роут в диспатчер для обработки событий бота
    app.state.dp.include_router(main_bot_router)
    #При продакшене будем использовать вэб хук а при тестовой среде пуллинг
    if settings.mode == "dev":
        logger.info("Бот настроен на тестовую среду телеграмма")
        await delete_webhook_if_set(app.state.bot)
        app.state.polling_task = await start_polling_background(dp=app.state.dp,bot= app.state.bot)
    else:
        logger.info("Бот настрое на продакшен среду телеграмма(Основное приложение)")
        await set_webhook(
            bot=app.state.bot,
            url=settings.public_url,
            secret=settings.web_hook_token,
            allowed_updates=app.state.dp.resolve_used_update_types()
        )
    # Настриваем планировщик 
    app.state.scheduler = create_scheduler()
    each_time_set_status_cb = make_change_status_job_spec(app.state.async_sessionmaker)
    app.state.scheduler.add_job(**each_time_set_status_cb.as_add_job_kwargs())
    app.state.scheduler.start()
    logger.info(f"Планировщик запущен!!!")
    try:
        yield
    finally:
        # shutdown
        app.state.scheduler.shutdown(wait=False)
        # Корректно остановить polling-таск (если он есть)
        task = getattr(app.state, "polling_task", None)
        if task:
            task.cancel()
            with suppress(asyncio.CancelledError):
                await task
        # тут теперь МОЖНО await — мы в async-контексте
        await app.state.bot.session.close()
        await app.state.engine.dispose()
        await app.state.async_engine.dispose()
        

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
#Подставление контекста для каждого запроса
@app.middleware("http")
async def add_req_id(request:Request, call_next):
    token = req_id_var.set(str(uuid.uuid4()))
    try:
        return await call_next(request)
    finally:
        req_id_var.reset(token)
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
    
@app.post("/telegram/webhook")
async def telegram_webhook(
    request: Request,
    x_telegram_bot_api_secret_token: str | None = Header(None),
    dp:Dispatcher = Depends(get_dispatcher),
    bot:Dispatcher = Depends(get_bot),
):
    if x_telegram_bot_api_secret_token != settings.web_hook_token:
        return Response(status_code=403)
    update = Update.model_validate(await request.json())
    result: TelegramMethod | None = await dp.feed_update(bot, update)
    # Если хендлер вернул метод — отдадим его прямо в ответ (экономит запрос к Bot API)
    if result is not None:
        return Response(result.model_dump_json(), media_type="application/json")
    return {"ok": True}
