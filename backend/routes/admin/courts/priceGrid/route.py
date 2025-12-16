from typing import List
from fastapi import APIRouter, Body, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from fapi_dependency import get_db, require_admin
from routes.admin.courts.priceGrid.schemas import PriceGridPayload
from routes.admin.courts.priceGrid.services import get_price_grid, replace_price_grid_for_court
from schemas.main_schemes import PriceGridOut


router = APIRouter(prefix="/admin/courts/priceGrid", tags=["Ценовая сетка"], dependencies=[Depends(require_admin)])

@router.post("/{court_id}", response_model=List[PriceGridOut], description="Обновляет создает ценовые сетки для корта")
def create_new_grid(court_id:int= Path(...),payload:List[PriceGridPayload]=Body(...), session:Session = Depends(get_db)):
    try:
        return replace_price_grid_for_court(session, court_id=court_id, payload=payload)
    except Exception  as e:
        raise HTTPException(detail=f"Ошибка создания диапазона цен")
@router.get("/{court_id}", response_model=List[PriceGridOut])
def get_price_grids_endpoint(court_id:int= Path(...), session:Session = Depends(get_db)):
    try:
        return get_price_grid(session, court_id=court_id)
    except Exception as e:
        raise HTTPException(detail=f"Не удалось получить сетки цен", status_code=500)