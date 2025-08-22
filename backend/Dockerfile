FROM python:3.11.9 AS builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN mkdir db_data
ENV DATABASE_URL="sqlite:////db_data/data.db" \
    REMINDER_LEAD_TIME="30" \
    BOT_TOKEN_TEST='2200985795:AAGGHMzWcAzmj_t6lcIgP92eQJB-hnvPxmA'\
    BOT_TOKEN='8041474392:AAFC4dBXpuIr1K35TmvhCR3HiTyxgKBKhvU'\
    MODE="prod" \
    REMINDER_LEAD_TIME="30"\
    TZ="Europe/Moscow" \
    SCHEDULER_DB="sqlite:////db_data/scheduler.sqlite"



WORKDIR /app
COPY . .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

# Указываем entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
