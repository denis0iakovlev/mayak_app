from aiogram import Bot
from sqlalchemy.orm import Session

from logger.logging import get_logger
from model_db.main_model import Booking
from routes.user.utils import get_remind_at
from scheduler.jobs import reminder_job_id
from utils.db_utils import get_admins
from utils.send_message_utils import notify_users, update_message_in_groups
from Settings import settings
from apscheduler.schedulers.asyncio import AsyncIOScheduler

logger = get_logger("utils.notify_utils")

def notify_cancel_booking(session:Session, bot:Bot,scheduler:AsyncIOScheduler, msg:str,booking:Booking):
    try:
        admins = get_admins(session)
        notify_users(bot, msg, [usr.telegram_id for usr in admins])
        update_message_in_groups(bot=bot, db=session)
        job_id = reminder_job_id(booking.id, get_remind_at(booking,settings.reminder_lead_time))
        scheduler.remove_job(job_id)
    except Exception as e:
        logger.error("Не удалось удалить бронирование id = %d из планировщика и(или) обновить сообщение в группе", booking.id)