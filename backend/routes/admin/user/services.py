from sqlalchemy.orm import Session 
from logger.logging import get_logger
from model_db.main_model import User
from routes.admin.user.schemas import UpdateUserByAdmin
logger = get_logger("routes.admin.user.services")

def update_user_by_admin(user_id:int, payload:UpdateUserByAdmin, session:Session):
    try:
        user = session.get(User, user_id)
        if not user :
            raise Exception(f"Пользователя с id {user_id} - не существует")
        filled = payload.model_dump(exclude_none=True)
        for k, v in filled.items():
            setattr(user, k, v)
        session.commit()
        session.refresh(user)
        return user
    except Exception as e:
        logger.info("Не удалось обновить пользователя с id = %d", user_id)
        raise e