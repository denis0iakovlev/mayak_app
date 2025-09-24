import anyio
from typing import List
from aiogram import Bot
from aiogram.types import ChatFullInfo, Message
from sqlalchemy.orm import Session
from db.main_model import Booking, Court
import datetime
from Settings import settings
from sqlalchemy import select, asc
from logger.logging import get_logger

logger = get_logger("bot.sendMsg")
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

def notify_users(bot:Bot, text: str, user_ids:List[int] ):
    for usr_id in user_ids:
        send_text(bot = bot, chat_id=usr_id,text= text)

def post_bookings_in_group(bot:Bot, db:Session):
    today_dat =  datetime.date.today().strftime("%Y-%m-%d")
    stmt = select(Booking, Court)
    send_text(bot, chat_id=-5017337454, text = "Тестовое сообщение")
    

def get_chat_id(bot:Bot, group_name:str)->ChatFullInfo:
    return anyio.from_thread.run(_get_chat_id, bot, group_name)

async def _get_chat_id(bot:Bot, group_name:str)->ChatFullInfo:
    try:
        return await bot.get_chat(group_name)
    except Exception as e:
        print(e)

def edit_message(bot:Bot, chat_id:int, message_id:int, new_text:str):
    return anyio.from_thread.run(_edit_msg, bot, chat_id, message_id, new_text)

async def _edit_msg(bot:Bot, chat_id:int, msg_id:int, new_text:str):
    try:
        edited_msg:Message = await bot.edit_message_text(text=new_text, chat_id=chat_id, message_id=msg_id)
        edited_msg.answer("обновление списка бронирований прошло успешно")
    except Exception as e:
        print(e)
        logger.error(e)

