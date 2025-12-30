from typing import Any, Optional
from pydantic import BaseModel
from sqlalchemy.inspection import inspect

from model_db.main_model import User

def sa_model_kwargs(model_cls, data: dict[str, Any]) -> dict[str, Any]:
    """Оставляет только поля, которые являются колонками SQLAlchemy-модели."""
    cols = {c.key for c in inspect(model_cls).mapper.column_attrs}
    return {k: v for k, v in data.items() if k in cols}

class TgUserInfo (BaseModel):
    telegram_id:int 
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    def to_orm(self) -> User:
        return User(**sa_model_kwargs(User, self.model_dump(exclude_unset=True)))