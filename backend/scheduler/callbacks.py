from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from datetime import datetime
from db.main_model import Booking
from Settings import settings
from bot.sendMsg import _send_text_async
from aiogram import Bot
from sqlalchemy import select, or_, and_
from logger.logging import get_logger

logger = get_logger("scheduler.callbacks")

async def change_status(sessionmaker:async_sessionmaker[AsyncSession]):
    try:
        async with sessionmaker() as session:
            now = datetime.now(settings.tzInfo)
            #Обойти все бронирования 
            current_time = now.time().replace(microsecond=0)
            res = await session.execute(select(Booking).where(
                or_(Booking.date < now.date().isoformat(), 
                    and_(
                        Booking.date == now.date().isoformat(),
                        Booking.start_time < current_time
                    ))
            ))
            bookings = res.scalars().all()
            for book in bookings:
                if book.status == 0:
                    try:
                        book.status = 2
                        logger.info(f"[+] Бронирование {book.id} перенесено в режим не оплачено.")
                        await session.commit()
                    except Exception as e:
                        await session.rollback()
    except Exception as e:
        raise Exception(f"Не удалось запустить планировщикю Текст ошибки {str(e)}")


async def reminder_job(bot: Bot,user_id:int, reminder_text:str):
    await _send_text_async(bot = bot, chat_id=user_id,text=reminder_text)