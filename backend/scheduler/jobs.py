from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Dict, Any, Optional, Callable
from Settings import settings
from scheduler.callbacks import reminder_job, change_status
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from aiogram import Bot
from db.main_model import Booking
from logger.logging import get_logger
from bot.msg_creator import create_notify_booking

logger = get_logger("scheduler.job")

@dataclass
class JobSpec:
    id:str
    func:Callable
    trigger:str
    args:tuple = ()
    kwargs:Dict[str, Any] = field(default_factory=dict)
    #опциональные параметры
    run_date:Optional[datetime] = None
    minutes:Optional[int] = None
    replace_existing:bool = True
    jobstore:str="default"
    misfire_grace_time:int = 600

    def as_add_job_kwargs(self) -> Dict[str, Any]:
        d: Dict[str, Any] = {
            "id": self.id,
            "func": self.func,
            "trigger": self.trigger,
            "args": self.args,
            "kwargs": self.kwargs,
            "replace_existing": self.replace_existing,
            "jobstore": self.jobstore,
            "misfire_grace_time": self.misfire_grace_time,
        }
        if self.run_date is not None:
            d["run_date"] = self.run_date
        if self.minutes is not None:
            d["minutes"] = self.minutes
        return d

#Генерация уникального job_id
def _reminder_job_id(booking_id: int, start_at: datetime) -> str:
    return f"booking_reminder_{booking_id}_{int(start_at.timestamp())}"   

def make_reminder_job_spec(booking: Booking, bot:Bot) -> Optional[JobSpec]:
    """Создаёт напоминание за некоторое время до начала.
    Вернёт None, если ставить напоминание уже поздно.
    """
    dateBook = datetime.fromisoformat(booking.date)
    startDt = datetime.combine(dateBook, booking.start_time, tzinfo=settings.tzInfo)
    run_at = startDt - timedelta(minutes=settings.reminder_lead_time)
    logger.info('Напоминание сработает в %s}', run_at.strftime("%d/%m/%y %H:%M"))
    job_id = _reminder_job_id(booking.id, startDt)
    notify_message = create_notify_booking(booking)
    return JobSpec(
        id=job_id,
        func=reminder_job,
        trigger="date",
        run_date=run_at,
        kwargs={
            "bot":bot,
            "user_id":booking.user_id,
            "reminder_text":notify_message
        },
        jobstore="default",
        misfire_grace_time=600
    )

def make_change_status_job_spec(sessionmaker:async_sessionmaker[AsyncSession])->JobSpec:
    """Фабрика описания периодической задачи."""
    return JobSpec(
        id="change_status_job",
        func=change_status,
        trigger="interval",
        minutes=1,
        kwargs={
            "sessionmaker":sessionmaker
        },
        jobstore="default",
        misfire_grace_time=600
    )