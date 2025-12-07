from fastapi import APIRouter
from routes.admin.courts.schemas import CreateCourtPayload, UpdateCourtPayload
from sqlalchemy.orm import Session
from fastapi import Depends, Path, Body
from fapi_dependency import get_db, require_admin
from routes.admin.courts.services import change_court, create_court, delete_court
from schemas.main_schemes import CourtOut

router = APIRouter(prefix="/admin/courts", tags=["Управление кортами"], dependencies=[Depends(require_admin)])
    
@router.post("/add", response_model=CourtOut)
def add_new_court(
    payload:CreateCourtPayload = Body(...),
    db:Session = Depends(get_db)     
    ):
    return create_court(payload=payload, db=db)

@router.patch("/{court_id}", response_model=CourtOut)
def change_court_endpoint(
    court_id:int=Path(...),
    payload:UpdateCourtPayload = Body(...),
    db:Session =Depends(get_db)
):
    return change_court(court_id, db, payload)

#Удалить корт из БД
@router.delete("/{court_id}")
def delete_court(
    court_id=Path(...),
    db:Session = Depends(get_db)
    ):
    return delete_court(court_id, db)