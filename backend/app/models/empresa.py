from sqlalchemy import Column, Integer, String, Boolean

from app.core.database import Base


class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, autoincrement=False)
    razao_social = Column(String(255))
    cnpj = Column(String(20))
    cidade = Column(String(100))
    uf = Column(String(2))
    ativo = Column(Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "razaoSocial": self.razao_social,
            "cnpj": self.cnpj,
            "cidade": self.cidade,
            "uf": self.uf,
            "ativo": self.ativo,
        }
