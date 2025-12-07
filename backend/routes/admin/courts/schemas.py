from pydantic import BaseModel
from datetime import time

class PriceGridOut(BaseModel):
    id:int
    time_start : time
    time_end : time
    price : int
    price_trainer : int
    class Config:
        from_attributes = True

class UpdateCourtPayload(BaseModel):
    name:str |None = None
    description:str | None = None
    is_active:bool | None = None

class CreateCourtPayload(BaseModel):
    admin_id:int
    name:str
    description:str | None = "Площадка"
    is_active:bool | None = None