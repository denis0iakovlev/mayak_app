from pydantic import BaseModel


class UpdateUserByAdmin(BaseModel):
    username:str|None = None
    role:int |None = None
    is_trainer:bool |None = None
    phone_number:str|None = None