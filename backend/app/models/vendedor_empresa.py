from sqlalchemy import Column, Integer, PrimaryKeyConstraint

from app.core.database import Base


class VendedorEmpresa(Base):
    __tablename__ = "vendedor_empresas"

    vendedor_id = Column(Integer, nullable=False)
    empresa_id = Column(Integer, nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint("vendedor_id", "empresa_id"),
    )

    def to_dict(self):
        return {
            "vendedorId": self.vendedor_id,
            "empresaId": self.empresa_id,
        }
