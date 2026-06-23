from sqlalchemy import Column, Integer, Float, Boolean

from app.core.database import Base


class RegraNegocio(Base):
    __tablename__ = "regras_negocio"

    id = Column(Integer, primary_key=True, autoincrement=True)
    desconto_maximo = Column(Float, default=15.0)
    pedido_minimo = Column(Float, default=500.0)
    bloqueio_inadimplencia = Column(Boolean, default=True)
    comissao_padrao = Column(Float, default=5.0)
    prazo_maximo = Column(Integer, default=90)
    validar_estoque = Column(Boolean, default=True)
    permitir_venda_sem_estoque = Column(Boolean, default=False)
    nf_automatica = Column(Boolean, default=True)
    aprovar_desconto_acima = Column(Float, default=10.0)
    pedido_minimo_representante = Column(Float, default=300.0)
    credito_automatico = Column(Boolean, default=False)
    multiplo_venda = Column(Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "descontoMaximo": self.desconto_maximo,
            "pedidoMinimo": self.pedido_minimo,
            "bloqueioInadimplencia": self.bloqueio_inadimplencia,
            "comissaoPadrao": self.comissao_padrao,
            "prazoMaximo": self.prazo_maximo,
            "validarEstoque": self.validar_estoque,
            "permitirVendaSemEstoque": self.permitir_venda_sem_estoque,
            "nfAutomatica": self.nf_automatica,
            "aprovarDescontoAcima": self.aprovar_desconto_acima,
            "pedidoMinimoRepresentante": self.pedido_minimo_representante,
            "creditoAutomatico": self.credito_automatico,
            "multiploVenda": self.multiplo_venda,
        }
