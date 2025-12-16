from pydantic import BaseModel
from datetime import time

class CreateUpdateCourtPayload(BaseModel):
    name:str |None = None
    description:str | None = None
    is_active:bool | None = None