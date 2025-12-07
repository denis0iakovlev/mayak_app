import logging,  sys
from logging.config import dictConfig
from Settings import settings
from logger.context import req_id_var, chat_id_var, user_id_var

def setup_logging():
    fmt_console = "%(asctime)s %(levelname)s %(name)s: %(message)s"
    fmt_enriched = (
        "%(asctime)s %(levelname)s %(name)s "
        "[req_id=%(req_id)s chat=%(chat_id)s user=%(user_id)s]: %(message)s"
    )

    # Фильтр, который подставляет пустые значения, если контекст не проставлен
    class ContextDefaults(logging.Filter):
        def filter(self, record):
            record.req_id  = getattr(record, "req_id", None)  or req_id_var.get()
            record.chat_id = getattr(record, "chat_id", None) or chat_id_var.get()
            record.user_id = getattr(record, "user_id", None) or user_id_var.get()
            return True

    handlers = {
        "console": {
            "class": "logging.StreamHandler",
            "stream": sys.stdout,
            "filters": ["ctx"],
        }
    }

    formatters = {
        "plain": {"format": fmt_console},
        "enriched": {"format": fmt_enriched},
    }

    dictConfig({
        "version": 1,
        "disable_existing_loggers": False,
        "filters": {"ctx": {"()": ContextDefaults}},
        "formatters": formatters if not settings.log_json else {
            # Простой JSON-формат без сторонних библиотек
            "json": {
                "format": ('{"t":"%(asctime)s","lvl":"%(levelname)s","logger":"%(name)s",'
                           '"msg":"%(message)s","req_id":"%(req_id)s","chat_id":"%(chat_id)s",'
                           '"user_id":"%(user_id)s"}')
            }
        },
        "handlers": {
            "console": {
                **handlers["console"],
                "formatter": "json" if settings.log_json else "enriched",
            }
        },
        "root": {"level": settings.log_level, "handlers": ["console"]},
        # Поднимаем уровни для сторонних болтливых логгеров при желании
        "loggers": {
            "uvicorn": {"level": "INFO"},
            "aiohttp": {"level": "WARNING"},
            "aiogram": {"level": "INFO"},
        },
    })

def get_logger(name: str | None = None) -> logging.Logger:
    return logging.getLogger(name or settings.log_level)
