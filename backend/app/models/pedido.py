from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    numero = Column(Integer)
    cliente_id = Column(Integer)
    cliente_nome = Column(String(255))
    vendedor_id = Column(Integer)
    vendedor_nome = Column(String(255))
    transportadora_id = Column(Integer)
    pagamento = Column(String(100))
    data = Column(DateTime)
    valor_total = Column(Float, default=0.0)
    status = Column(String(50), default="pendente")
    tipo_operacao_id = Column(Integer)
    tipo_operacao = Column(String(100))
    updated_at = Column(DateTime)
    itens = relationship("PedidoItem", back_populates="pedido", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "numero": self.numero,
            "clienteId": self.cliente_id,
            "clienteNome": self.cliente_nome,
            "vendedorId": self.vendedor_id,
            "vendedorNome": self.vendedor_nome,
            "transportadoraId": self.transportadora_id,
            "pagamento": self.pagamento,
            "data": self.data.isoformat() if self.data else None,
            "valorTotal": self.valor_total,
            "status": self.status,
            "tipoOperacaoId": self.tipo_operacao_id,
            "tipoOperacao": self.tipo_operacao,
            "itens": [i.to_dict() for i in self.itens] if self.itens else [],
        }


class PedidoItem(Base):
    __tablename__ = "pedido_itens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=False)
    sequencia = Column(Integer)
    produto_id = Column(Integer)
    produto_nome = Column(String(255))
    referencia = Column(String(50))
    quantidade = Column(Float, default=0.0)
    valor_unitario = Column(Float, default=0.0)
    valor_total = Column(Float, default=0.0)
    desconto = Column(Float, default=0.0)
    desconto_percentual = Column(Float, default=0.0)
    pendente = Column(String(1), default="N")
    controle = Column(String(50))
    updated_at = Column(DateTime)

    pedido = relationship("Pedido", back_populates="itens")

    def to_dict(self):
        return {
            "pedidoId": self.pedido_id,
            "sequencia": self.sequencia,
            "produtoId": self.produto_id,
            "produtoNome": self.produto_nome,
            "referencia": self.referencia,
            "quantidade": self.quantidade,
            "valorUnitario": self.valor_unitario,
            "valorTotal": self.valor_total,
            "desconto": self.desconto,
            "descontoPercentual": self.desconto_percentual,
            "pendente": self.pendente,
            "controle": self.controle,
        }
