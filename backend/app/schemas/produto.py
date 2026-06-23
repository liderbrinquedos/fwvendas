from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProdutoCreate(BaseModel):
    id: int
    codigo: Optional[str] = None
    referencia: Optional[str] = None
    nome: str
    unidade: Optional[str] = None
    ativo: bool = True
    grupo_id: Optional[int] = None
    categoria: Optional[str] = None
    ean: Optional[str] = None
    ncm: Optional[str] = None
    usoprod: Optional[str] = None
    status_produto: Optional[str] = None
    estoque: float = 0.0
    estoque_min: float = 0.0
    peso: float = 0.0
    altura: float = 0.0
    largura: float = 0.0
    comprimento: float = 0.0
    metro_cubico: float = 0.0
    qtd_caixa: int = 1
    multiplo_venda: float = 1.0
    factory_id: Optional[int] = None
    factory_name: Optional[str] = None
    updated_at: Optional[datetime] = None


class ProdutoResponse(BaseModel):
    id: int
    codigo: Optional[str] = None
    referencia: Optional[str] = None
    nome: str
    unidade: Optional[str] = None
    ativo: bool
    grupoId: Optional[int] = None
    categoria: Optional[str] = None
    ean: Optional[str] = None
    ncm: Optional[str] = None
    usoProd: Optional[str] = None
    statusProduto: Optional[str] = None
    estoque: float
    estoqueMin: float
    peso: float
    altura: float
    largura: float
    comprimento: float
    metroCubico: float
    qtdCaixa: int
    multiploVenda: float
    factoryId: Optional[int] = None
    factoryName: Optional[str] = None

    class Config:
        from_attributes = True
