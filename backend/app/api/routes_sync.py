from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user
from app.services.sync_service import SyncService, MODULES

router = APIRouter(prefix="/api/v1/sync", tags=["sync"])


@router.post("/{modulo}")
async def sync_module(
    modulo: str,
    meses: int = Query(6, ge=0, description="Meses para filtrar pedidos (0=todos)"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if modulo not in MODULES and modulo != "all":
        return {"status": "error", "message": f"Modulo invalido. Opcoes: {', '.join(MODULES)}"}

    service = SyncService()

    if modulo == "all":
        results = await service.sync_all_modules()
        return {"status": "success", "results": [r.model_dump() for r in results]}
    else:
        result = await service.sync_module(modulo, db, meses=meses)
        return {"status": "success", "result": result.model_dump()}

@router.get("/status")
async def sync_status(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = SyncService()
    return service.get_status(db)