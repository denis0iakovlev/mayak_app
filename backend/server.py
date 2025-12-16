from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager, suppress
import asyncio
from scheduler.scheduler import create_scheduler
from scheduler.jobs import make_change_status_job_spec
from Settings import settings
from bot.bot_mw import LogContextMiddleware
import uuid
from logger.context import req_id_var
from logger.logging import setup_logging, get_logger
from utils.core import create_async, create_sync
from bot.core import create_bot, create_dispatcher, delete_webhook_if_set, start_polling_background, set_webhook
from bot.bot_mw import LogContextMiddleware, DBSessionMiddleWare
from bot.bot_routes import r as main_bot_router
#routes
from routes.user.router import router as user_routes
from routes.share.router import router as share_router
from routes.admin.courts.route import router as admin_courts_routes
from routes.admin.courts.priceGrid.route import router as admin_price_grid
from routes.admin.user.route import router as admin_user_route
from routes.admin.booking.route import router as admin_booking_route
from routes.admin.tgChats.router import router as tg_chat_router
from routes.telegram.route import router as webhook_router
#Настроить логирование
setup_logging()

logger = get_logger("server.main")

@asynccontextmanager
async def lifespan(app:FastAPI):
    logger.info("Выполняем подготовительную работу перед стартом сервере")
    #Начинаем с установки сессий (асинхронной и синхронной ) к БД
    sync_url = settings.database_url
    sync_url = sync_url.replace("+aiosqlite", "")
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
@app.middleware("https")
async def add_req_id(request:Request, call_next):
    token = req_id_var.set(str(uuid.uuid4()))
    try:
        return await call_next(request)
    finally:
        req_id_var.reset(token)
#Добадение роутов
app.include_router(user_routes)
app.include_router(admin_courts_routes)
app.include_router(admin_booking_route)
app.include_router(admin_user_route)
app.include_router(tg_chat_router)
app.include_router(share_router)
app.include_router(webhook_router)
app.include_router(admin_price_grid)

