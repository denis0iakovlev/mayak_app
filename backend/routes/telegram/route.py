from aiogram import Bot, Dispatcher
from fastapi import APIRouter, Depends, Header, Request, Response

from Settings import settings
from fapi_dependency import get_bot, get_dispatcher
from aiogram.types import Update
from aiogram.methods import TelegramMethod

router = APIRouter(prefix="/telegram/webhook", tags=["Telegram webhook"])

@router.post("")
async def telegram_webhook(
    request: Request,
    x_telegram_bot_api_secret_token: str | None = Header(None),
    dp:Dispatcher = Depends(get_dispatcher),
    bot:Bot = Depends(get_bot),
):
    if x_telegram_bot_api_secret_token != settings.web_hook_token:
        return Response(status_code=403)
    update = Update.model_validate(await request.json())
    result: TelegramMethod | None = await dp.feed_update(bot, update)
    # Если хендлер вернул метод — отдадим его прямо в ответ (экономит запрос к Bot API)
    if result is not None:
        return Response(result.model_dump_json(), media_type="application/json")
    return {"ok": True}