from pydantic import BaseModel
from typing import Optional


class TransportadoraCreate(BaseModel):
    id: int
    razao_social: Optional[str] = None
    nome: str
    cnpj: Optional[str] = None
    ie: Optional[str] = None
    tipo_frete: Optional[str] = None
    cep: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    perfil: Optional[str] = None
    regioes: Optional[str] = None
    prazo: Optional[str] = None
    ativo: bool = True


class TransportadoraResponse(BaseModel):
    id: int
    razaoSocial: Optional[str] = None
    nome: str
    cnpj: Optional[str] = None
    ie: Optional[str] = None
    tipoFrete: Optional[str] = None
    cep: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    perfil: Optional[str] = None
    regioes: Optional[str] = None
    prazo: Optional[str] = None
    ativo: bool

    class Config:
        from_attributes = True
