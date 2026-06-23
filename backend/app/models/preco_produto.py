from sqlalchemy import Column, Integer, Float, UniqueConstraint

from app.core.database import Base


class PrecoProduto(Base):
    __tablename__ = "precos_produto"

    id = Column(Integer, primary_key=True, autoincrement=True)
    codtab = Column(Integer, nullable=False)
    empresa_id = Column(Integer, nullable=False, index=True)
    produto_id = Column(Integer, nullable=False, index=True)
    preco = Column(Float, default=0.0)

    __table_args__ = (
        UniqueConstraint("codtab", "produto_id", name="uq_precos_produto"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "codtab": self.codtab,
            "empresaId": self.empresa_id,
            "produtoId": self.produto_id,
            "preco": self.preco,
        }
