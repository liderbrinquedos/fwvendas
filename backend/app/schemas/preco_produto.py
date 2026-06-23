from pydantic import BaseModel
from typing import Optional


class PrecoProdutoCreate(BaseModel):
    codtab: int
    empresa_id: int
    produto_id: int
    preco: float = 0.0


class PrecoProdutoResponse(BaseModel):
    id: int
    codtab: int
    empresaId: int
    produtoId: int
    preco: float

    class Config:
        from_attributes = True
