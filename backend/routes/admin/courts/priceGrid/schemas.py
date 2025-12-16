from datetime import time
from pydantic import BaseModel, Field, model_validator


class PriceGridPayload(BaseModel):
    time_start: time = Field(..., description="Начало временного слота (HH:MM)")
    time_end: time = Field(..., description="Конец временного слота (HH:MM)")
    price: int = Field(..., ge=0, description="Цена без тренера")
    price_trainer: int = Field(..., ge=0, description="Цена с тренером")

    @model_validator(mode="after")
    def validate_time_range(self):
        if self.time_start >= self.time_end:
            raise ValueError("time_start должен быть меньше time_end")
        return self

