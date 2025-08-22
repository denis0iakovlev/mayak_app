from pydantic_settings import BaseSettings
from pydantic import Field, field_validator, computed_field
from typing import List, Union
from zoneinfo import ZoneInfo

class Settings(BaseSettings):
    """Настройки приложения, загружаемые из переменных окружения / .env.
    Все параметры имеют безопасные дефолты, чтобы приложение не падало без .env.
    """
    database_url:str = Field(default="sqlite:////db_data/data.db")
    bot_token: str =Field()
    bot_token_test: str =Field()
    mode: str =Field("dev")
    reminder_lead_time: int = Field(default=10)


    # APScheduler
    tz: str = Field(default="Europe/Moskow")
    scheduler_db: str = Field(default="sqlite:///db_data/scheduler.sqlite")

    @computed_field
    @property
    def tzInfo(self)->ZoneInfo:
        return ZoneInfo(self.tz)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

settings = Settings()
