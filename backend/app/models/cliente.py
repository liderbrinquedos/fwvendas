from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime

from app.core.database import Base


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    razao_social = Column(String(255), nullable=False)
    nome_fantasia = Column(String(255))
    cnpj = Column(String(18))
    ie = Column(String(50))
    suframa = Column(String(50))
    email = Column(String(255))
    email_nfe = Column(String(255))
    telefone = Column(String(50))
    cep = Column(String(10))
    logradouro = Column(String(255))
    numero = Column(String(20))
    complemento = Column(String(255))
    bairro = Column(String(100))
    cidade = Column(String(100))
    uf = Column(String(2))
    limite_credito = Column(Float, default=0.0)
    codigo_vendedor = Column(Integer)
    simples_nacional = Column(Boolean, default=False)
    tipo_parceiro = Column(String(50))
    ativo = Column(Boolean, default=True)
    updated_at = Column(DateTime)

    def to_dict(self):
        return {
            "id": self.id,
            "razaoSocial": self.razao_social,
            "nomeFantasia": self.nome_fantasia,
            "cnpj": self.cnpj,
            "ie": self.ie,
            "suframa": self.suframa,
            "email": self.email,
            "emailNfe": self.email_nfe,
            "telefone": self.telefone,
            "cep": self.cep,
            "logradouro": self.logradouro,
            "numero": self.numero,
            "complemento": self.complemento,
            "bairro": self.bairro,
            "cidade": self.cidade,
            "uf": self.uf,
            "limiteCredito": self.limite_credito,
            "codigoVendedor": self.codigo_vendedor,
            "simplesNacional": self.simples_nacional,
            "tipoParceiro": self.tipo_parceiro,
            "ativo": self.ativo,
        }
