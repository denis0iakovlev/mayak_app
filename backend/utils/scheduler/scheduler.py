from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from utils.scheduler.jobs import JobSpec
from Settings import settings

def create_scheduler()->AsyncIOScheduler:
    jobstores = {"default": SQLAlchemyJobStore(url=settings.scheduler_db)}
    scheduler = AsyncIOScheduler(jobstores=jobstores, timezone=settings.tz)
    scheduler.configure(job_defaults={"coalesce":True, "max_instances":1})
    return scheduler
def registry_job(scheduler:AsyncIOScheduler, job:JobSpec):
    scheduler.add_job(**job.as_add_job_kwargs())