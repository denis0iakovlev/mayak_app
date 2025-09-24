from typing import Tuple
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker,AsyncSession, AsyncEngine
from sqlalchemy import create_engine, Engine
from sqlalchemy.orm import sessionmaker, Session

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
    return sync_engine, session_maker

