# aiogram_mw.py
from aiogram import BaseMiddleware
from typing import Any, Callable, Dict, Awaitable
from logger.context import chat_id_var, user_id_var
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

class LogContextMiddleware(BaseMiddleware):
    async def __call__(self,
                       handler: Callable[[Any, Dict[str, Any]], Awaitable[Any]],
                       event: Any,
                       data: Dict[str, Any]) -> Any:
        # Пытаемся достать chat_id и user_id из разных типов апдейтов
        chat_id = getattr(getattr(event, "chat", None), "id", None) \
                  or getattr(getattr(event, "message", None), "chat", None) and event.message.chat.id
        user_id = getattr(getattr(event, "from_user", None), "id", None) \
                  or getattr(getattr(event, "message", None), "from_user", None) and event.message.from_user.id

        t1 = chat_id_var.set(str(chat_id or "-"))
        t2 = user_id_var.set(str(user_id or "-"))
        try:
            return await handler(event, data)
        finally:
            chat_id_var.reset(t1)
            user_id_var.reset(t2)

class DBSessionMiddleWare(BaseMiddleware):
    def __init__(self, sessionmaker:async_sessionmaker[AsyncSession]):
        super().__init__()
        self.sessionmaker = sessionmaker
    async def __call__(self,
                        handler:Callable[[Any,Dict[str, Any]], Awaitable[Any]],
                        event:Any,
                        data:Dict[str, Any]
        )->Any:
        async with self.sessionmaker() as session:
            data["session"] = session
            try:
                return await handler(event, data)
            except Exception:
                try:
                    await session.rollback()
                except Exception:
                    pass
                raise