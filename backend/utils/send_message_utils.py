import anyio
from typing import List
from aiogram import Bot
from aiogram.types import ChatFullInfo, Message
from sqlalchemy.orm import Session
from model_db.main_model import ChatToPublic, User
from utils.db_utils import get_bookings_last_5_days
from utils.msg_creator import create_booking_msg
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
        try:
            send_text(bot = bot, chat_id=usr_id,text= text)
        except Exception as e:
            logger.error(str(e))

def update_message_in_groups(bot:Bot, db:Session):
    stmt = select(ChatToPublic).where(ChatToPublic.can_send == True, ChatToPublic.post_scheduler == True, ChatToPublic.editing_msg_id != None)
    res = db.execute(stmt).scalars().all()
    admins =  db.execute(select(User.telegram_id).where(User.role == 1)).scalars().all()
    if len(res) > 0:
        #получить весь список бронирований за пять дней 
        grouped_bookings = get_bookings_last_5_days(db=db)
        text = create_booking_msg(grouped_bookings)
        for chat in res:
            try:
                new_msg = edit_message(bot=bot, chat_id=chat.chat_id, message_id=chat.editing_msg_id, new_text=text)
                chat.editing_msg_id = new_msg.message_id
            except Exception as e:
                chat.editing_msg_id = None
                for id in list(admins):
                    try:
                        send_text(bot,id, f"Группа {chat.name_chat} - {str(e)}")
                    except Exception as e:
                        logger.error(str(e))  
        db.commit()
    

def get_chat_id(bot:Bot, group_name:str)->ChatFullInfo:
    return anyio.from_thread.run(_get_chat_id, bot, group_name)

async def _get_chat_id(bot:Bot, group_name:str)->ChatFullInfo:
    try:
        return await bot.get_chat(group_name)
    except Exception as e:
        print(e)

def edit_message(bot:Bot, chat_id:int, message_id:int, new_text:str)->Message:
    return anyio.from_thread.run(_edit_msg, bot, chat_id, message_id, new_text)

async def _edit_msg(bot:Bot, chat_id:int, msg_id:int|None, new_text:str):
    try:
        if msg_id is not None:
            is_deleted:bool = await bot.delete_message( chat_id=chat_id, message_id=msg_id)
            if not is_deleted:
                raise Exception("Не удалось удалить предыдущее сообщение расписания")
        new_edit_message:Message = await bot.send_message(chat_id=chat_id, text=new_text)
        if new_edit_message is None:
            raise Exception("Не удалось опубликовать расписание")
        return new_edit_message
    except Exception as e:
        print(e)
        logger.error(e)
        raise  e
