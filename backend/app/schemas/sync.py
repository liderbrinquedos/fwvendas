from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SyncResult(BaseModel):
    modulo: str
    registros: int
    status: str
    mensagem: Optional[str] = None


class SyncStatus(BaseModel):
    is_syncing: bool
    last_sync: Optional[datetime] = None
    last_full_sync: Optional[datetime] = None
    modules: dict[str, SyncResult] = {}