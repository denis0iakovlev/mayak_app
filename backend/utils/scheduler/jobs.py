from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Dict, Any, Optional, Callable
from Settings import settings
from utils.scheduler.callbacks import reminder_job, change_status
from aiogram import Bot

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

def make_reminder_job_spec(booking_id: int, user_chat_id: int, start_at: datetime, bot:Bot) -> Optional[JobSpec]:
    """Создаёт описание задачи-напоминания (без немедленной регистрации).
    Вернёт None, если ставить напоминание уже поздно.
    """
    run_at = start_at - timedelta(minutes=settings.reminder_lead_time)
    now_utc = datetime.now(settings.tzInfo)

    job_id = _reminder_job_id(booking_id, start_at)

    # if run_at <= now_utc:
    #     return None

    return JobSpec(
        id=job_id,
        func=reminder_job,
        trigger="date",
        run_date=run_at,
        kwargs={
            "booking_id": booking_id,
            "chat_id": user_chat_id,
            "bot":bot
        },
        jobstore="default",
        misfire_grace_time=600
    )

def make_change_status_job_spec()->JobSpec:
    """Фабрика описания периодической задачи."""
    return JobSpec(
        id="change_status_job",
        func=change_status,
        trigger="interval",
        minutes=1,
        jobstore="default",
        misfire_grace_time=600
    )