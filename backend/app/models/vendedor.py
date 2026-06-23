from sqlalchemy import Column, Integer, String, Boolean, DateTime

from app.core.database import Base


class Vendedor(Base):
    __tablename__ = "vendedores"

    id = Column(Integer, primary_key=True, autoincrement=False)
    nome = Column(String(255), nullable=False)
    tipo = Column(String(2))
    gerente_id = Column(Integer)
    ativo = Column(Boolean, default=True)
    email = Column(String(255))
    senha = Column(String(255), default="1234")
    updated_at = Column(DateTime)

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "tipo": self.tipo,
            "gerenteId": self.gerente_id,
            "ativo": self.ativo,
            "email": self.email,
        }