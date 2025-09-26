import os 
import asyncio
from logger.logging import get_logger
from aiogram import Bot, Dispatcher
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.client.telegram import TEST
from Settings import settings

log = get_logger("bot.core")

async def create_bot()->Bot:
    log.info("Создаем и настриваем бота")

    is_dev = settings.mode == "dev"
    log.info("Бот будет создаваться для " + "продуктовой среды" if is_dev else "тестовой среды")
    token = settings.bot_token_test if is_dev else settings.bot_token
    if not token:
        raise RuntimeError("Не установлен токен бота")
    session =  AiohttpSession(api=TEST) if is_dev else  AiohttpSession()
    bot = Bot(token=token, session=session)
    me = await bot.me()
    log.info("Authorized as @%s (id=%s) | DEV=%s", me.username, me.id, is_dev)
    return bot

def create_dispatcher() -> Dispatcher:
    return Dispatcher()

async def delete_webhook_if_set(bot: Bot) -> None:
    try:
        info = await bot.get_webhook_info()
        if info.url:
            log.warning("Webhook is set: %s — deleting for polling...", info.url)
            await bot.delete_webhook(drop_pending_updates=False)
    except Exception as e:
        log.exception("get_webhook_info/delete_webhook failed: %s", e)

async def set_webhook(bot: Bot, url: str | None, secret: str | None, allowed_updates: list[str]):
    if not url:
        raise RuntimeError("PUBLIC_URL is required for webhook")
    await bot.set_webhook(
        url=url,
        secret_token=secret,
        drop_pending_updates=True,
        allowed_updates=allowed_updates,
    )
    log.info("Webhook set to %s", url)

async def start_polling_background(dp: Dispatcher, bot: Bot) -> asyncio.Task:
    """Запускает polling в фоновом таске (для FastAPI lifespan)."""
    return asyncio.create_task(
        dp.start_polling(
            bot,
            allowed_updates=dp.resolve_used_update_types(),
            handle_signals=False,
        )
    )
