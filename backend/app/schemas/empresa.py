from pydantic import BaseModel
from typing import Optional


class EmpresaCreate(BaseModel):
    id: int
    razao_social: str
    cnpj: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    ativo: bool = True


class EmpresaResponse(BaseModel):
    id: int
    razaoSocial: str
    cnpj: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    ativo: bool

    class Config:
        from_attributes = True
