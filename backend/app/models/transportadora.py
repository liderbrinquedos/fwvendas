from sqlalchemy import Column, Integer, String, Boolean

from app.core.database import Base


class Transportadora(Base):
    __tablename__ = "transportadoras"

    id = Column(Integer, primary_key=True, autoincrement=False)
    razao_social = Column(String(255))
    nome = Column(String(255), nullable=False)
    cnpj = Column(String(18))
    ie = Column(String(50))
    tipo_frete = Column(String(50))
    cep = Column(String(10))
    telefone = Column(String(50))
    email = Column(String(255))
    perfil = Column(String(100))
    regioes = Column(String(255))
    prazo = Column(String(50))
    ativo = Column(Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "razaoSocial": self.razao_social,
            "nome": self.nome,
            "cnpj": self.cnpj,
            "ie": self.ie,
            "tipoFrete": self.tipo_frete,
            "cep": self.cep,
            "telefone": self.telefone,
            "email": self.email,
            "perfil": self.perfil,
            "regioes": self.regioes,
            "prazo": self.prazo,
            "ativo": self.ativo,
        }
