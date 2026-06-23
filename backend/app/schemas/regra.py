from pydantic import BaseModel
from typing import Optional


class RegraNegocioCreate(BaseModel):
    desconto_maximo: float = 15.0
    pedido_minimo: float = 500.0
    bloqueio_inadimplencia: bool = True
    comissao_padrao: float = 5.0
    prazo_maximo: int = 90
    validar_estoque: bool = True
    permitir_venda_sem_estoque: bool = False
    nf_automatica: bool = True
    aprovar_desconto_acima: float = 10.0
    pedido_minimo_representante: float = 300.0
    credito_automatico: bool = False
    multiplo_venda: bool = True


class RegraNegocioResponse(BaseModel):
    id: int
    descontoMaximo: float
    pedidoMinimo: float
    bloqueioInadimplencia: bool
    comissaoPadrao: float
    prazoMaximo: int
    validarEstoque: bool
    permitirVendaSemEstoque: bool
    nfAutomatica: bool
    aprovarDescontoAcima: float
    pedidoMinimoRepresentante: float
    creditoAutomatico: bool
    multiploVenda: bool

    class Config:
        from_attributes = True
