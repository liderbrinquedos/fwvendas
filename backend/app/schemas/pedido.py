from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PedidoItemCreate(BaseModel):
    sequencia: Optional[int] = None
    produto_id: Optional[int] = Field(None, alias="produtoId")
    produto_nome: Optional[str] = Field(None, alias="produtoNome")
    referencia: Optional[str] = None
    quantidade: float = 0.0
    valor_unitario: float = Field(0.0, alias="valorUnitario")
    valor_total: float = Field(0.0, alias="valorTotal")
    desconto: float = 0.0
    desconto_percentual: float = Field(0.0, alias="descontoPercentual")
    pendente: Optional[str] = "N"
    controle: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True


class PedidoItemResponse(BaseModel):
    pedidoId: int
    sequencia: Optional[int] = None
    produtoId: Optional[int] = None
    produtoNome: Optional[str] = None
    referencia: Optional[str] = None
    quantidade: float
    valorUnitario: float
    valorTotal: float
    desconto: float
    descontoPercentual: float
    pendente: Optional[str] = None
    controle: Optional[str] = None

    class Config:
        from_attributes = True


class PedidoCreate(BaseModel):
    id: Optional[int] = None
    numero: Optional[int] = None
    cliente_id: Optional[int] = Field(None, alias="clienteId")
    cliente_nome: Optional[str] = Field(None, alias="clienteNome")
    vendedor_id: Optional[int] = Field(None, alias="vendedorId")
    vendedor_nome: Optional[str] = Field(None, alias="vendedorNome")
    transportadora_id: Optional[int] = Field(None, alias="transportadoraId")
    pagamento: Optional[str] = None
    data: Optional[datetime] = None
    valor_total: float = Field(0.0, alias="valorTotal")
    status: Optional[str] = "pendente"
    tipo_operacao_id: Optional[int] = Field(None, alias="tipoOperacaoId")
    tipo_operacao: Optional[str] = Field(None, alias="tipoOperacao")
    updated_at: Optional[datetime] = None
    itens: Optional[list[PedidoItemCreate]] = None

    class Config:
        populate_by_name = True


class PedidoValidateItem(BaseModel):
    produtoId: int
    produtoNome: str = ""
    referencia: Optional[str] = None
    quantidade: float = 0.0
    valorUnitario: float = 0.0
    valorTotal: float = 0.0
    desconto: float = 0.0
    descontoPercentual: float = 0.0


class PedidoValidate(BaseModel):
    clienteId: int
    vendedorId: int
    valorTotal: float = 0.0
    pagamento: str = ""
    itens: list[PedidoValidateItem] = []


class PedidoResponse(BaseModel):
    id: int
    numero: Optional[int] = None
    clienteId: Optional[int] = None
    clienteNome: Optional[str] = None
    vendedorId: Optional[int] = None
    vendedorNome: Optional[str] = None
    transportadoraId: Optional[int] = None
    pagamento: Optional[str] = None
    data: Optional[datetime] = None
    valorTotal: float
    status: Optional[str] = None
    tipoOperacaoId: Optional[int] = None
    tipoOperacao: Optional[str] = None
    itens: list[PedidoItemResponse] = []

    class Config:
        from_attributes = True
