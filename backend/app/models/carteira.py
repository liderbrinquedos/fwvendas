from sqlalchemy import Column, Integer, String

from app.core.database import Base


class CarteiraCliente(Base):
    __tablename__ = "carteira_clientes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vendedor_id = Column(Integer, nullable=False, index=True)
    vendedor_nome = Column(String(255))
    tipo_vendedor = Column(String(2))
    cliente_id = Column(Integer, nullable=False, index=True)
    cliente_nome = Column(String(255))

    def to_dict(self):
        return {
            "id": self.id,
            "vendedorId": self.vendedor_id,
            "vendedorNome": self.vendedor_nome,
            "tipoVendedor": self.tipo_vendedor,
            "clienteId": self.cliente_id,
            "clienteNome": self.cliente_nome,
        }
