from routes.user.schemas import BookingCreatePayload, ChangeStatusBookingPayload
from aiogram import Bot
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session
from utils.db_utils import get_user, get_admins
from model_db.main_model import Booking, Court, User
from logger.logging import get_logger
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from scheduler.jobs import make_reminder_job_spec, reminder_job_id
from utils.notify_utils import notify_cancel_booking
from utils.send_message_utils import notify_users, send_text, update_message_in_groups
from routes.user.utils import get_remind_at, calc_fee
from Settings import settings

logger = get_logger("route.user.service")

def create_booking(user_id:int, payload:BookingCreatePayload, bot:Bot, scheduler:AsyncIOScheduler, session:Session )->Booking:
    user = session.get(User, user_id)
    #Проверить что время свободно
    exists = session.query(Booking).filter(
        Booking.date == payload.dateBooking.isoformat(),
        Booking.court_id == payload.court_id,
        Booking.start_time < payload.end_time,
        Booking.end_time > payload.start_time,
        Booking.status == 0
    ).first()
    if exists:
        raise Exception("Время занято")
    #Проверить корт что он не закрыт
    court = session.get(Court, payload.court_id)
    if court is None or not court.is_active:
        raise Exception("Корт не доступен")
    #посчитать стоимость бронирования
    fee = calc_fee(start=payload.start_time, end=payload.end_time,is_trainer=user.is_trainer, grids=court.grids)
    logger.info("booking %s from %s to %s cost %d", payload.dateBooking,payload.start_time, payload.end_time, fee )
    # Создать бронь
    booking = Booking(
        date=payload.dateBooking,
        start_time=payload.start_time,
        end_time=payload.end_time,
        court_id=payload.court_id,
        user_id=user.telegram_id,
        fee=fee,
    )
    session.add(booking)
    session.commit()
    session.refresh(booking)
    stmt = select(Booking).options(
        joinedload(Booking.court)
    ).where(
        Booking.id == booking.id 
    )
    res = session.execute(stmt).scalars().first()
    #отправить всем админам сообщение о новом бронировании
    reminder_job = make_reminder_job_spec(booking=res,remind_at=get_remind_at(res, settings.reminder_lead_time), bot=bot)
    if reminder_job != None :
        scheduler.add_job(**reminder_job.as_add_job_kwargs())
        logger.info("Добавлен подзадача по напоминанию по бронированию %d",booking.id)
    admin_msg = f'Пользователь {user.first_name} забронировал корт {booking.court_id} на {payload.dateBooking.strftime("%d/%m/%Y")} \nВремя: {payload.start_time.strftime("%H:%M")} - {payload.end_time.strftime("%H:%M")}.\n Телефон: {user.phone_number}'
    #Оповестить админов о том что кто-то забронировал время
    admins = get_admins(session)
    notify_users(bot=bot, text=admin_msg, user_ids =  [ad.telegram_id for ad in admins])
    #Отправить сообщение пользователю что он забронировал время
    send_text(bot=bot, chat_id=user.telegram_id,text = f'Вы забронировали корт {booking.court_id} на {booking.date}\n Время: {payload.start_time.strftime("%H:%M")} - {payload.end_time.strftime("%H:%M")}')
    #Обновить/создать сообщение в общей группе с перечислением бронирований
    #Получить все группы в которые необходимо постить сообщения
    update_message_in_groups(bot=bot, db=session)
    return booking
#Изменить статус бронирования
def change_booking_status(user_id:int,payload:ChangeStatusBookingPayload, session:Session, bot:Bot, scheduler:AsyncIOScheduler)->dict:
    user = get_user(user_id,session)
    booking = session.get(Booking, payload.booking_id)
    if not booking:
        raise Exception("Отсутсвует бронирование с переданным id")
    if payload.new_status == 3:
        msg = f'{user.first_name} - отменил бронирование на {booking.date} \nВремя: {booking.start_time.strftime("%H:%M")}-{booking.end_time.strftime("%H:%M")}'
        notify_cancel_booking(session, bot, scheduler, msg, booking)
        session.delete(booking)
    else:
        booking.status = payload.new_status
    session.commit()
    return {"status": "ok", "detail": "Статус изменен успешно"}