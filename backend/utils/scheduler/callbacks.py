from utils.db_utils import SessionLocal
from sqlalchemy.orm import Session
from datetime import datetime
from utils.db_model import Booking
from Settings import settings
from utils.bot.sendMsg import _send_text_async
from aiogram import Bot

async def change_status():
    db:Session = SessionLocal()
    try:
        now = datetime.now(settings.tzInfo)
        print(f"Sheduler for api is runned - {now}")
        #Обойти все бронирования 
        current_time = now.time().replace(microsecond=0)
        bookings = db.query(Booking).filter(Booking.date == now.date().isoformat(),
                                           Booking.start_time <= current_time ).all()
        for book in bookings:
            if book.status == 0:
                try:
                    book.status = 2
                    print(f"[+] Бронирование {book.id} перенесено в режим не оплачено.")
                    db.commit()
                except Exception as e:
                    db.delete(book)
    except Exception as e:
        raise Exception(f"Не удалось запустить планировщикю Текст ошибки {str(e)}")
    finally:
        db.close()


async def reminder_job(booking_id, chat_id:int, bot: Bot):
    db:Session = SessionLocal()
    now = datetime.now(settings.tzInfo)
    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        dt = datetime.strptime(booking.date, "%Y-%m-%d")
        st = datetime.combine(dt, booking.start_time)
        if not booking:
            return
        #На будущее если вместо удаления записи будем менять статус
        #Отправить сообщение пользователю что его бронирование скоро начнется
        msg = f'⏰ Напоминание: через {settings.reminder_lead_time} минут начинается бронь корта #{booking.court_id}. Время бронирования ({booking.start_time.strftime("%H:%M")}-{booking.end_time.strftime("%H:%M")}). C уважением админстрация кортов в лице ГД Жеребцова А.Н. 🐴'
        await _send_text_async(bot = bot, chat_id=booking.user_id,text=msg)
    finally:
        db.close()