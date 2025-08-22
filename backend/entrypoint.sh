#!/bin/bash

# Проверяем наличие файла БД, если нет — создаём таблицы
if [ ! -f "/db_data/data.db" ]; then
    echo "[INIT] Creating SQLite DB at /db_data/data.db"
    python -c 'from models import Base; from sqlalchemy import create_engine; import os; Base.metadata.create_all(bind=create_engine(os.getenv("DATABASE_URL")))'
fi

# Применяем миграции Alembic
echo "[MIGRATION] Applying Alembic migrations..."
#alembic upgrade head

# Запускаем сервер
echo "[START] Launching FastAPI app..."
exec "$@"