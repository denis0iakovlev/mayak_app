from routes.admin.courts.schemas import CreateCourtPayload, UpdateCourtPayload
from fastapi import HTTPException
from sqlalchemy.orm import Session
from model_db.main_model import Court

def create_court(payload:CreateCourtPayload,
    db:Session )->Court:
    court = Court(
        name=payload.name,
        description=payload.description,
        is_active=payload.is_active
    )
    db.add(court)
    db.commit()
    db.refresh(court)
    return court

def change_court(court_id:int,db:Session, payload:UpdateCourtPayload ):
    court = db.get(Court, court_id)
    if court is None:
        raise HTTPException(status_code=407, detail="Корт с таким id отсутствует")
    update_court = payload.model_dump(exclude_none=True)
    for key, val in update_court.items():
        setattr(court, key, val)
    db.commit()
    db.refresh(court)
    return court

def delete_court(court_id:int,db:Session):
    court = db.get(Court, court_id)
    if not court:
        raise HTTPException(status_code=407, detail="В БД нет корта с переданным id")
    db.delete(court)
    db.commit()
    return {"status": "ok", "detail": "Корт был удален"}