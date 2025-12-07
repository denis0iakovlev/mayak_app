from typing import List
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy import select

from fapi_dependency import get_db, require_admin
from model_db.main_model import ChatToPublic
from routes.admin.tgChats.schemas import TgChat
from sqlalchemy.orm import Session

router = APIRouter(prefix="/admin/tgChats",tags=["Управление TG группами"], dependencies=[Depends(require_admin)])

@router.get("/all", response_model=List[TgChat])
def get_tg_chats(session:Session = Depends(get_db)):
    try:
        tg_chats = session.execute(select(ChatToPublic)).scalars().all()
        return list(tg_chats)
    except Exception as e:
        raise HTTPException(status_code=506, detail=f"Не удалось получить связанные группы в телеграмме. {str(e)}")

@router.delete("/{tg_chat_id}")
def delete_tg_chat(
    tg_chat_id:int = Path(...),
    session:Session = Depends(get_db)):
    try:
        tg_chat = session.get(ChatToPublic, tg_chat_id)
        session.delete(tg_chat)
        session.commit()
        return {"status":"ok", "detail":"Чат удален"}
    except Exception as e:
        raise HTTPException("Не удалось удалить tg_chat")