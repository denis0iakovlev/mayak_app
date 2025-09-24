from aiogram import Router, Bot
from aiogram.filters import CommandStart, Command
from aiogram.types import Message, ChatMemberUpdated, ChatMember
from logger.logging import get_logger
from sqlalchemy.ext.asyncio import AsyncSession
from db.main_model import ChatToPublic
from typing import Tuple
from Settings import settings

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

    can_send, status =  await bot_can_send_in_chat(bot, chat_id=chat.id)

    db_chat = await session.get(ChatToPublic, chat.id)

    if added or rights_changed:
        if db_chat:
            db_chat.can_send = can_send
            logger.info("Chat %s change status  to send post. %s -> %s ", chat.title, old_status, new_status)
        else:
            add = ChatToPublic(chat_id=chat.id,
                                post_scheduler= False,
                                can_send=can_send,
                                name_chat=chat.title
            )
            session.add(add)
            logger.info("DB: Add new chat for send message. Can send message : %s", can_send )
        await session.commit()
    if removed:
        if db_chat:
            db_chat.can_send = False
            db_chat.post_scheduler = False
            await session.commit()
            logger.info("DB: chat %s marked as cannot send(removed)", chat.title)
        else:
            pass


async def bot_can_send_in_chat(bot:Bot, chat_id:int)-> Tuple[bool, str]:
    """
        Проверяем что бот может (имеет права) писать в чат
    """
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
    return False, status

@r.message(Command("ps"))
async def add_chat_to_posting(m:Message, bot:Bot, session:AsyncSession):
    chat = await session.get(ChatToPublic, m.chat.id)
    can_post, status = await bot_can_send_in_chat(bot, m.chat.id)
    if chat is None:
        #проверяем права на публикацию 
        if can_post: 
            addChat = ChatToPublic(chat_id=chat.id,
                                post_scheduler=True,
                                can_send=can_post,
                                name_chat=chat.title
            )
            session.add(addChat)
            await session.commit()
        else:
            bot.send_message(m.chat.id, "Бот не может публиковать бронирования, у него не достаточно прав")
    else:
        chat.post_schedule = True
        chat.can_send = can_post
        await session.commit()
        if not can_post:
            bot.send_message(m.chat.id, "Бот не может публиковать бронирования, у него не достаточно прав.")


@r.message(Command("addpost"))
async def add_post(m:Message, bot:Bot, session:AsyncSession):
    #Проверить что в БД  уже добавлена данная группа
    chat = await session.get(ChatToPublic, m.chat.id)
    if chat is None:
        await bot.send_message(m.chat.id, "Данная группа не добавлена в список групп для публикации расписания")
    else:
        if not chat.can_send:
            await bot.send_message(m.chat.id, f"У бота нет разрешения на отправку сообщений")
        elif not chat.post_scheduler:
            await bot.send_message(m.chat.id, "Бот не настроен для отправки в эту группу списка бронирований. выполните команду /ps и повторите команду")
        else:
            sent = await bot.send_message(m.chat.id, "В этом посте будет отображено расписание")
            chat.editing_msg_id = sent.message_id
            await session.commit()




    