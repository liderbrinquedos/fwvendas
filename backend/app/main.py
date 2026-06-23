import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.database import Base, engine
from app.core.scheduler import init_scheduler
from app.api.routes_erp import router as erp_router
from app.api.routes_sync import router as sync_router
from app.api.routes_auth import router as auth_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Running migrations...")
    with engine.connect() as conn:
        conn.execute(__import__("sqlalchemy").text(
            "ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_cnpj_key"
        ))
        conn.execute(__import__("sqlalchemy").text(
            "ALTER TABLE produtos ALTER COLUMN ean TYPE VARCHAR(50)"
        ))
        conn.execute(__import__("sqlalchemy").text(
            "ALTER TABLE produtos DROP COLUMN IF EXISTS preco"
        ))
        conn.execute(__import__("sqlalchemy").text(
            "ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS senha VARCHAR(255) DEFAULT '1234'"
        ))
        conn.execute(__import__("sqlalchemy").text(
            "CREATE SEQUENCE IF NOT EXISTS clientes_id_seq"
        ))
        conn.execute(__import__("sqlalchemy").text(
            "ALTER TABLE clientes ALTER COLUMN id SET DEFAULT nextval('clientes_id_seq')"
        ))
        conn.execute(__import__("sqlalchemy").text(
            "CREATE TABLE IF NOT EXISTS business_rules ("
            "id VARCHAR(50) PRIMARY KEY, "
            "name VARCHAR(255) NOT NULL, "
            "description TEXT DEFAULT '', "
            "type VARCHAR(50) NOT NULL, "
            "enabled BOOLEAN DEFAULT TRUE, "
            "priority VARCHAR(20) DEFAULT 'MEDIUM', "
            "product_filter JSON, "
            "customer_filter JSON, "
            "date_range JSON, "
            "threshold JSON, "
            "min_order_value FLOAT, "
            "min_order_quantity FLOAT, "
            "discount_type VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE', "
            "discount_value FLOAT DEFAULT 0, "
            "deducts_from_commission BOOLEAN DEFAULT FALSE, "
            "progressive_tiers JSON, "
            "required_product_ids JSON, "
            "free_shipping_threshold FLOAT, "
            "created_at TIMESTAMP, "
            "updated_at TIMESTAMP, "
            "applied_count INTEGER DEFAULT 0"
            ")"
        ))
        conn.commit()
    logger.info("Running seed if empty...")
    from app.core.database import SessionLocal
    from app.seed import seed_database
    from app.core.auth import hash_password
    from app.models.vendedor import Vendedor
    db = SessionLocal()
    try:
        seed_database(db)
        default_senha = hash_password("1234")
        db.query(Vendedor).filter(
            (Vendedor.senha == None) | (Vendedor.senha == "")
        ).update({"senha": default_senha})
        db.commit()
        logger.info("Vendedores without password set to default 1234")
    finally:
        db.close()
    logger.info("Starting scheduler...")
    init_scheduler()
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="ForceVendas PRO - Backend ERP",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(erp_router)
app.include_router(sync_router)
app.include_router(auth_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "forcevendas-backend"}