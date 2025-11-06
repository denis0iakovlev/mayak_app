from aiogram import Router, Bot
from aiogram.filters import CommandStart, Command
from aiogram.types import Message, ChatMemberUpdated, ChatMember, Chat
from logger.logging import get_logger
from sqlalchemy.ext.asyncio import AsyncSession
from db.main_model import ChatToPublic, User
from sqlalchemy import select
from typing import Tuple
from Settings import settings
from bot.sendMsg import _send_text_async

NEW_MSG_TEXT = "В этом сообщении будет выводится расписание. После того как кто-то забронирует корт, вместо этого сообщения появится список бронирований. Вывод бронирований производится за следуюшие 5 дней, за исключением тех которые уже закончиличь сегодня или начнутся в ближайшие пол часа. Не удаляйте это сообщение."

logger = get_logger("bot.routers")
r = Router(name="main")

@r.message(CommandStart())
async def on_start(m:Message):
    await m.answer("Бот оповещения запущен")

@r.my_chat_member()
async def on_my_chat_member(upd:ChatMemberUpdated, bot:Bot, session:AsyncSession):
    chat = upd.chat
    old = upd.old_chat_member
    new = upd.new_chat_member

    old_status = getattr(old, "status", None)
    new_status = getattr(new, "status", None)

    logger.info(
        "[my_chat_member]  type=%s title=%r: %s -> %s",
        chat.type, chat.title, old_status, new_status,
    )

    # Классификация события
    added = old_status in {"left", "kicked"} and new_status not in {"left", "kicked"}
    removed = new_status in {"left", "kicked"}
    rights_changed = (not added) and (not removed) and (old_status != new_status or old != new)
    #Проверяем можно ли писать в группу
    if not removed:
        can_send, status =  await bot_can_send_in_chat(bot, chat_id=chat.id)
    else:
        can_send, status = (False, "removed")

    db_chat = await session.get(ChatToPublic, chat.id)
    if added or rights_changed:
        if chat.type in  ["group", "supergroup"]:
            if db_chat and not can_send:
                await update_or_create_posting_chat(chat, False, session )
                logger.info("Chat %s change status  to send post. %s -> %s ", chat.title, old_status, new_status)
                await notify_admins(session,bot, f"Бот был лишен прав на публикацию расписаний в группе {chat.title}")
        elif chat.type == "channel":
            logger.info("Обновление статуса постинга в каналах.")
            db_chat = await update_or_create_posting_chat(chat, is_posting=can_send, session=session)
            if can_send and db_chat.editing_msg_id == None:
                logger.info("Постинг бронирований в канале %s - создан")
                msg = await bot.send_message(chat_id=chat.id, text=NEW_MSG_TEXT)
                db_chat.editing_msg_id = msg.message_id
                await notify_admins(session,bot, f"Бот был добавлен в канал {chat.title} - для постина расписания")
            elif not can_send:
                db_chat.editing_msg_id = None
                logger.info("Постинг бронирований в канале %s - прекращен")
            await session.commit()

    if removed:
        if db_chat:
            await session.delete(db_chat)
            await session.commit()
            logger.info("DB: chat %s marked as cannot send(removed)", chat.title)
            await notify_admins(session,bot, f"Бот был удален из канала {chat.title}")
        else:
            pass


async def bot_can_send_in_chat(bot:Bot, chat_id:int)-> Tuple[bool, str]:
    """
        Проверяем что бот может (имеет права) писать в чат
    """
    status = "not member"
    try:
        me = await bot.me()
        cm:ChatMember = await bot.get_chat_member(chat_id=chat_id,user_id=me.id)
        status = cm.status # 'administrator' | 'creator' | 'member' | 'restricted' | 'left' | 'kicked'

        if status in {"creator", "administrator"}:
            return True, status
        if status == "member":
            #проверка глобальные разрешения на запись в чате
            chat = await bot.get_chat(chat_id)
            perms = chat.permissions
            if perms and (perms.can_send_messages is False):
                return False, 'chat_read_only'
            return True, "member"
        if status == "restricted":
            allowed = getattr(cm, "can_send_messages", None)
            return (bool(allowed), "restricted_allowed" if allowed else "restricted_blocked")
    except Exception as e:
        logger.error(str(e))
    return False, status

async def update_or_create_posting_chat(tg_chat:Chat,is_posting:bool, session:AsyncSession)->ChatToPublic:
    logger.info("Trying to add bot to group %d for posting bookings", tg_chat.id)
    chat = await session.get(ChatToPublic, tg_chat.id)
    if not chat:
        logger.info("Группа не  найдена, добавляем ", )
        chat = ChatToPublic(chat_id=tg_chat.id,
                                post_scheduler=is_posting,
                                can_send=is_posting,
                                name_chat=tg_chat.title
            )
        session.add(chat)
        await session.commit()
        logger.info("Added new posting chat name=%s id=%d", tg_chat.title, tg_chat.id)
    else:
        logger.info("Chat is find out. name=%s id=%d", tg_chat.title, tg_chat.id)
        chat.post_scheduler = is_posting
        chat.can_send = is_posting
        await session.commit()
        logger.info("Updated status posting. Old status is %s New status is %s", chat.post_scheduler, is_posting)
    await session.refresh(chat)
    return chat
       
@r.message(Command("post"))
async def add_post(m:Message, bot:Bot, session:AsyncSession):
    #Проверить что в БД  уже добавлена данная группа
    try:
        can_post, status = await bot_can_send_in_chat(bot=bot, chat_id=m.chat.id)
        logger.info("Bot can send message to group = %s. Bot status = %s", can_post, status)
        chat = await update_or_create_posting_chat(m.chat, can_post, session)
        if can_post:
            if chat.editing_msg_id is None:
                msg = await bot.send_message(m.chat.id, NEW_MSG_TEXT)
                chat.editing_msg_id = msg.message_id
                await session.commit()
            else:
                message = "Данный бот уже првязан к данной группе и публикует бронирования."
                await bot.send_message(m.from_user.id, message)
                await bot.send_message(m.chat.id, message)
        else:
            await bot.send_message(m.from_user.id, f"Бот не может публиковать расписание, так как не имеет в группе {m.chat.title} прав на отправку сообщений, измените права для бота и повторите команду. Текущий статус бота в группе {status}.")
    except Exception as e:
        await bot.send_message(m.from_user.id, f"Не удалось добавить группу для публикации из-за неизвестной ошибки.")
        logger.error("Не удалось добавить группу для публикациию Текст ошибки %s", str(e))
    
@r.message(Command("unpost"))
async def add_post(m:Message, bot:Bot, session:AsyncSession):
    #В не зависмости от возможности публиковать или нет сообщения группе ставится статус не публиковать
    chat = await update_or_create_posting_chat(m.chat, False, session)
    chat.editing_msg_id = None
    await session.commit()
    await bot.send_message(m.from_user.id, f"Группа {m.chat.title} - исключена из групп для публикации бронирований")
    await bot.send_message(m.chat.id, f"Группа {m.chat.title} - исключена из групп для публикации бронирований")


async def notify_admins(session:AsyncSession, bot:Bot, text:str ):
    admins = (await session.execute(select(User.telegram_id).where(User.role == 1))).scalars().all()
    for id in list(admins):
        try:
            await _send_text_async(bot,id, text)
        except Exception as e:
            logger.error(str(e))
    