from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TipoNegociacaoCreate(BaseModel):
    id: int
    nome: str = ""
    ativo: bool = True
    parcelas: int = 0
    prazo_min: Optional[int] = None
    prazo_max: int = 0
    prazo_max_pri_parcela: int = 0
    taxa_juro: Optional[float] = None
    base_prazo: int = 0
    venda_min: float = 0.0
    venda_max: float = 0.0
    desc_max: Optional[float] = None
    perc_min_entrada: float = 0.0
    status_tipo: str = "ATIVO"
    updated_at: Optional[datetime] = None


class TipoNegociacaoResponse(BaseModel):
    id: int
    nome: str
    ativo: bool
    parcelas: int
    prazo_min: Optional[int] = None
    prazo_max: int
    prazo_max_pri_parcela: int
    taxa_juro: Optional[float] = None
    base_prazo: int
    venda_min: float
    venda_max: float
    desc_max: Optional[float] = None
    perc_min_entrada: float
    status_tipo: str

    class Config:
        from_attributes = True
