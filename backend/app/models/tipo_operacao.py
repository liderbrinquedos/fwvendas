from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.core.database import Base


class TipoOperacao(Base):
    __tablename__ = "tipos_operacao"

    id = Column(Integer, primary_key=True, autoincrement=False)
    nome = Column(String(255), nullable=False)
    tipo_movimento = Column(String(10), nullable=True)
    ativo = Column(Boolean, default=True)
    status_operacao = Column(String(20), default="ATIVO")
    updated_at = Column(DateTime)

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "tipoMovimento": self.tipo_movimento,
            "ativo": self.ativo,
            "statusOperacao": self.status_operacao,
        }
