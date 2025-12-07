from typing import List
from fastapi import APIRouter, Body, Depends, HTTPException, Path
from sqlalchemy import select

from fapi_dependency import get_db, require_admin
from model_db.main_model import User
from routes.admin.user.schemas import UpdateUserByAdmin
from routes.admin.user.services import update_user_by_admin
from schemas.main_schemes import UserOut
from sqlalchemy.orm import Session

router = APIRouter(prefix="/admin/user",tags=["Управление пользователями"], dependencies=[Depends(require_admin)])

@router.get("/users", response_model=List[UserOut])
def get_all_users(session:Session = Depends(get_db)):
    try:
        users = session.execute(select(User)).scalars().all()
        return list(users)
    except Exception as e:
        raise HTTPException(status_code=505, detail=f"Не удалось получить список игроков")

@router.delete("/{user_id}")
def delete_user(user_id:int = Path(...), session:Session= Depends(get_db)):
    try:
        user = session.get(User, user_id)
        session.delete(user)
        session.commit()
        return {"status":"ok","detail":"игрок удален"}
    except Exception as e:
        raise HTTPException(status_code=505, detail=f"Не удалось удалить пользователя")

@router.patch("/{user_id}", response_model=UserOut)
def update_user_by_admin_endpount(user_id:int = Path(...),
                         payload:UpdateUserByAdmin = Body(...),
                         session:Session = Depends(get_db)):
    try:
        return update_user_by_admin(user_id, payload, session)
    except Exception as e:
        raise HTTPException(status_code=505, detail=f"Не удалось обновить данные пользователя. {str(e)}")