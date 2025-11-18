from fastapi import APIRouter
from typing import List
from routes.admin.schemes.scheme import CreateCourtPayload, UpdateCourtPayload
from sqlalchemy.orm import Session
from db.utils import get_admin_user
from fastapi import Depends, HTTPException, Query, Path, Body
from db.main_model import Court
from fapi_dependency import get_db

router = APIRouter(prefix="/admin/courts", tags=["Administration courts"])
    
@router.post("")
def add_new_court(
    payload:CreateCourtPayload,
    db:Session = Depends(get_db)     
    ):
    court = Court(
        name=payload.name,
        description=payload.description,
        is_active=payload.isActive
    )
    db.add(court)
    db.commit()
    db.refresh
    return {"status":"ok", "detail":"Корт был добавлен"}


@router.patch("/{court_id}")
def change_court_info(
    court_id:int=Path(...),
    admin_id:int=Query(...),
    payload:UpdateCourtPayload = Body(...),
    db:Session =Depends(get_db)
):
    try:
        get_admin_user(admin_id, db)
        court = db.get(Court, court_id)
        if court is None:
            raise Exception("Корт с таким id отсутствует")
        update_court = payload.model_dump(exclude_none=True)
        for key, val in update_court.items():
            setattr(court, key, val)
        db.commit()
        db.refresh(court)
        return {"status":"success", "detail":"Параметры корта обновлены"}
    except Exception as e:
        return HTTPException(status_code=500, detail=str(e))


#Удалить корт из БД
@router.delete("/{court_id}")
def delete_court(court_id=Path(...), admin_id:int= Query(...), db:Session = Depends(get_db)):
    try:
        admin = get_admin_user(admin_id, db)
        court = db.get(Court, court_id)
        if not court:
            raise HTTPException(status_code=504, detail="В БД нет корта с переданным id")
        db.delete(court)
        db.commit()
        db.refresh()
        return {"status": "ok", "detail": "Корт был удален"}
    except Exception as e:
         return HTTPException(status_code=510, detail=f"Не удалось удалить корт из БД.Текст ошибки: {str(e)}")