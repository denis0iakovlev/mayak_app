from typing import Iterable
from sqlalchemy.orm import Session
from sqlalchemy import delete, select, and_
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from routes.admin.courts.priceGrid.schemas import PriceGridPayload
from schemas.main_schemes import PriceGridOut
from model_db.main_model import PriceGrid

def _validate_no_overlaps(items: Iterable[PriceGridPayload]) -> list[PriceGridOut]:
    """Валидация, что внутри входного списка нет пересечений по времени.

    Правило пересечения: [start, end) пересекается с [a, b) если start < b и end > a.

    Валидация делается сортировкой по time_start и проверкой соседних интервалов.
    """
    normalized = list(items)

    # Базовые проверки диапазонов уже сделаны в PriceGridCreate (time_start < time_end),
    # но на всякий случай не полагаемся на это на 100%.
    for i, it in enumerate(normalized):
        if it.time_start >= it.time_end:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Некорректный диапазон времени в элементе #{i}: time_start должен быть меньше time_end.",
            )

    normalized.sort(key=lambda x: (x.time_start, x.time_end))

    for idx in range(1, len(normalized)):
        prev = normalized[idx - 1]
        cur = normalized[idx]
        if cur.time_start < prev.time_end:  # пересечение
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Во входной сетке есть пересекающиеся диапазоны времени. "
                    f"Конфликт: {prev.time_start}-{prev.time_end} и {cur.time_start}-{cur.time_end}."
                ),
            )

    return normalized


def replace_price_grid_for_court(
    db: Session,
    *,
    court_id: int,
    payload: list[PriceGridPayload],
) -> list[PriceGridOut]:
    """Полная замена (перезапись) ценовой сетки для конкретного корта.

    Контракт:
    - endpoint принимает массив слотов (payload: list[PriceGridCreate])
    - court_id передаётся через Path-параметр
    - новая сетка НЕ должна содержать пересечений внутри себя
    - после успешного вызова в БД останутся ТОЛЬКО слоты из payload

    Возвращает:
    - список PriceGridRead (актуальная сетка после замены)

    Примечания по конкуренции:
    - рекомендуемо вызывать в транзакции; ниже реализовано через явный commit/rollback.
    - UniqueConstraint защищает от точных дублей (court_id, time_start, time_end),
      а пересечения контролируются на уровне приложения.
    """

    slots = _validate_no_overlaps(payload)

    try:
        # 1) Удаляем все слоты корта
        db.execute(delete(PriceGrid).where(PriceGrid.court_id == court_id))

        # 2) Вставляем новые
        entities: list[PriceGrid] = [
            PriceGrid(
                court_id=court_id,
                time_start=s.time_start,
                time_end=s.time_end,
                price=s.price,
                price_trainer=s.price_trainer,
            )
            for s in slots
        ]

        if entities:
            db.add_all(entities)

        db.commit()

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Не удалось перезаписать сетку: конфликт уникальности или конкурентное обновление.",
        )

    # 3) Возвращаем актуальную сетку из БД (каноническое состояние)
    rows = db.execute(
        select(PriceGrid)
        .where(PriceGrid.court_id == court_id)
        .order_by(PriceGrid.time_start, PriceGrid.time_end)
    ).scalars().all()

    return [PriceGridOut.model_validate(r) for r in rows]

def get_price_grid(session:Session, *, court_id:int )->list[PriceGridOut]:
    grids = session.execute(select(PriceGrid).where(PriceGrid.court_id == court_id)).scalars().all()
    return [PriceGridOut.model_validate(r) for r in grids]
