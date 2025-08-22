import anyio
from typing import List
from aiogram import Bot
# ---------------------------
# Утилиты отправки сообщений
# ---------------------------

async def _send_text_async(bot:Bot, chat_id: int, text: str):
    """
    ЧИСТО АСИНХРОННАЯ отправка через aiogram.
    Вызывается через anyio.from_thread.run(...) из sync-контекста.
    """
    try:
        await bot.send_message(chat_id=chat_id, text=text)
    except Exception as e:
        print(e)

def send_text(bot:Bot,chat_id: int, text: str):
    """
    СИНХРОННАЯ обёртка для вызова из sync-кода (эндпойнтов, джоб APScheduler).
    Безопасно «прыгаем» в текущий event loop приложения.
    """
    return anyio.from_thread.run(_send_text_async,bot, chat_id, text)

def notify_users(bot:Bot,  text: str, user_ids:List[int] ):
    for usr_id in user_ids:
        send_text(bot = bot, chat_id=usr_id,text= text)