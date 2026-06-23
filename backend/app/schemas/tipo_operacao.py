from pydantic import BaseModel
from typing import Optional


class TipoOperacaoCreate(BaseModel):
    id: int
    nome: str
    tipo_movimento: Optional[str] = None
    ativo: bool = True
    status_operacao: Optional[str] = None


class TipoOperacaoResponse(BaseModel):
    id: int
    nome: str
    tipo_movimento: Optional[str] = None
    ativo: bool = True
    status_operacao: Optional[str] = None

    class Config:
        from_attributes = True
