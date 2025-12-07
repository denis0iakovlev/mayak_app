from typing import Optional
from pydantic import BaseModel


class TgChat(BaseModel):
    chat_id:int
    editing_msg_id:Optional[int]
    post_scheduler:bool
    can_send:bool
    name_chat:str
    class Config:
        from_attributes = True