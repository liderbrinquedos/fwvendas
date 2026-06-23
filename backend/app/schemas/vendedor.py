from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class VendedorCreate(BaseModel):
    id: int
    nome: str
    tipo: Optional[str] = None
    gerente_id: Optional[int] = None
    ativo: bool = True
    email: Optional[str] = None
    senha: str = ""
    updated_at: Optional[datetime] = None


class VendedorResponse(BaseModel):
    id: int
    nome: str
    tipo: Optional[str] = None
    gerenteId: Optional[int] = None
    ativo: bool
    email: Optional[str] = None

    class Config:
        from_attributes = True