from pydantic import BaseModel
from typing import Optional


class CarteiraClienteCreate(BaseModel):
    vendedor_id: int
    vendedor_nome: Optional[str] = None
    tipo_vendedor: Optional[str] = None
    cliente_id: int
    cliente_nome: Optional[str] = None


class CarteiraClienteResponse(BaseModel):
    id: int
    vendedorId: int
    vendedorNome: Optional[str] = None
    tipoVendedor: Optional[str] = None
    clienteId: int
    clienteNome: Optional[str] = None

    class Config:
        from_attributes = True
