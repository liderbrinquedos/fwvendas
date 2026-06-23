from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime

from app.core.database import Base


class Produto(Base):
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, autoincrement=False)
    codigo = Column(String(50), unique=True)
    referencia = Column(String(50))
    nome = Column(String(255), nullable=False)
    unidade = Column(String(10))
    ativo = Column(Boolean, default=True)
    grupo_id = Column(Integer)
    categoria = Column(String(100))
    ean = Column(String(50))
    ncm = Column(String(20))
    usoprod = Column(String(10))
    status_produto = Column(String(50))
    estoque = Column(Float, default=0.0)
    estoque_min = Column(Float, default=0.0)
    peso = Column(Float, default=0.0)
    altura = Column(Float, default=0.0)
    largura = Column(Float, default=0.0)
    comprimento = Column(Float, default=0.0)
    metro_cubico = Column(Float, default=0.0)
    qtd_caixa = Column(Integer, default=1)
    multiplo_venda = Column(Float, default=1.0)
    factory_id = Column(Integer)
    factory_name = Column(String(255))
    updated_at = Column(DateTime)

    def to_dict(self):
        return {
            "id": self.id,
            "codigo": self.codigo,
            "referencia": self.referencia,
            "nome": self.nome,
            "unidade": self.unidade,
            "ativo": self.ativo,
            "grupoId": self.grupo_id,
            "categoria": self.categoria,
            "ean": self.ean,
            "ncm": self.ncm,
            "usoProd": self.usoprod,
            "statusProduto": self.status_produto,
            "precoBase": 0.0,
            "estoque": self.estoque,
            "estoqueMin": self.estoque_min,
            "peso": self.peso,
            "altura": self.altura,
            "largura": self.largura,
            "comprimento": self.comprimento,
            "metroCubico": self.metro_cubico,
            "qtdCaixa": self.qtd_caixa,
            "multiploVenda": self.multiplo_venda,
            "factoryId": self.factory_id,
            "factoryName": self.factory_name,
        }
