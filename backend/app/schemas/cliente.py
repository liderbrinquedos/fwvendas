from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ClienteCreate(BaseModel):
    model_config = {"populate_by_name": True}

    id: Optional[int] = None
    razao_social: str = Field(..., alias="razaoSocial")
    nome_fantasia: Optional[str] = Field(None, alias="nomeFantasia")
    cnpj: Optional[str] = None
    ie: Optional[str] = None
    suframa: Optional[str] = None
    email: Optional[str] = None
    email_nfe: Optional[str] = Field(None, alias="emailNfe")
    telefone: Optional[str] = None
    cep: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    limite_credito: float = Field(0.0, alias="limiteCredito")
    codigo_vendedor: Optional[int] = Field(None, alias="codigoVendedor")
    simples_nacional: bool = Field(False, alias="simplesNacional")
    tipo_parceiro: Optional[str] = Field(None, alias="tipoParceiro")
    ativo: bool = True
    updated_at: Optional[datetime] = None


class ClienteResponse(BaseModel):
    id: int
    razaoSocial: str
    nomeFantasia: Optional[str] = None
    cnpj: Optional[str] = None
    ie: Optional[str] = None
    suframa: Optional[str] = None
    email: Optional[str] = None
    emailNfe: Optional[str] = None
    telefone: Optional[str] = None
    cep: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    limiteCredito: float = 0.0
    codigoVendedor: Optional[int] = None
    simplesNacional: bool
    tipoParceiro: Optional[str] = None
    ativo: bool

    class Config:
        from_attributes = True
