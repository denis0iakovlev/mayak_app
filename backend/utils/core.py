from typing import Tuple
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker,AsyncSession, AsyncEngine
from sqlalchemy import create_engine, Engine
from sqlalchemy.orm import sessionmaker, Session
from model_db.main_model import Base, User
from logger.logging import get_logger

logger = get_logger("core.session_init")


def create_async(url:str)->Tuple[AsyncEngine, async_sessionmaker[AsyncSession]]:
    async_engine =  create_async_engine(url=url, pool_pre_ping=True)
    async_session_maker = async_sessionmaker(async_engine, expire_on_commit=False)
    return async_engine, async_session_maker

def create_sync(url:str, is_sqlite:bool)->Tuple[Engine, Session]:
    kwargs = {"pool_pre_ping":True}
    if is_sqlite:
        kwargs["connect_args"] = {"check_same_thread":False}
    sync_engine = create_engine(url, **kwargs)
    session_maker = sessionmaker(sync_engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=sync_engine)
    logger.info("Создано движок и фабрика сессий. Актуализирована модель данных")
    #Проверка что есть admin
    with session_maker() as session:
        admin = session.get(User, 104)
        if admin is None:
            logger.info("В БД отсутствует нулевой админ ... Создаем...")
            zero_admin = User(telegram_id=104,first_name="admin", last_name="admin", role=1)
            session.add(zero_admin)
            session.commit()
        else:
            logger.info("Нулевой админ существует.")
    return sync_engine, session_maker

