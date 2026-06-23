import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.config import settings
from app.services.sync_service import SyncService

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()
sync_service = SyncService()


async def sync_incremental():
    logger.info("Starting incremental sync...")
    try:
        results = await sync_service.sync_all_modules(tipo="incremental")
        for r in results:
            logger.info(f"  {r.modulo}: {r.registros} registros - {r.status}")
        logger.info("Incremental sync completed")
    except Exception as e:
        logger.exception(f"Incremental sync failed: {e}")


async def sync_full():
    logger.info("Starting full sync (clean + reload)...")
    if sync_service._lock.locked():
        logger.warning("Full sync skipped: another sync is already in progress")
        return
    try:
        from app.core.database import SessionLocal
        from sqlalchemy import text

        db = SessionLocal()
        try:
            logger.info("Truncating tables for full sync...")
            db.execute(text("DELETE FROM pedido_items"))
            db.execute(text("DELETE FROM pedidos"))
            db.execute(text("DELETE FROM clientes"))
            db.execute(text("DELETE FROM produtos"))
            db.execute(text("DELETE FROM vendedores"))
            db.execute(text("DELETE FROM transportadoras"))
            db.commit()
            logger.info("Tables truncated successfully")
        except Exception as e:
            db.rollback()
            logger.exception("Failed to truncate tables: %s", e)
            raise
        finally:
            db.close()

        results = await sync_service.sync_all_modules(tipo="full")
        for r in results:
            logger.info(f"  {r.modulo}: {r.registros} registros - {r.status}")
        logger.info("Full sync completed")
    except Exception as e:
        logger.exception(f"Full sync failed: {e}")


def init_scheduler():
    scheduler.add_job(
        sync_incremental,
        "interval",
        minutes=settings.sync_interval_minutes,
        id="sync_incremental",
        replace_existing=True,
    )

    scheduler.add_job(
        sync_full,
        "cron",
        hour=settings.sync_full_hour,
        minute=0,
        id="sync_full",
        replace_existing=True,
    )

    scheduler.start()
    logger.info(
        f"Scheduler started: incremental every {settings.sync_interval_minutes}min, full daily at {settings.sync_full_hour}:00"
    )