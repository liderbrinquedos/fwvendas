from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from app.core.database import Base


class TipoNegociacao(Base):
    __tablename__ = "tipos_negociacao"

    id = Column(Integer, primary_key=True, autoincrement=False)
    nome = Column(String(255), nullable=False)
    ativo = Column(Boolean, default=True)
    parcelas = Column(Integer, default=0)
    prazo_min = Column(Integer, nullable=True)
    prazo_max = Column(Integer, default=0)
    prazo_max_pri_parcela = Column(Integer, default=0)
    taxa_juro = Column(Float, nullable=True)
    base_prazo = Column(Integer, default=0)
    venda_min = Column(Float, default=0.0)
    venda_max = Column(Float, default=0.0)
    desc_max = Column(Float, nullable=True)
    perc_min_entrada = Column(Float, default=0.0)
    status_tipo = Column(String(20), default="ATIVO")
    updated_at = Column(DateTime)

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "ativo": self.ativo,
            "parcelas": self.parcelas,
            "prazoMin": self.prazo_min,
            "prazoMax": self.prazo_max,
            "prazoMaxPriParcela": self.prazo_max_pri_parcela,
            "taxaJuro": self.taxa_juro,
            "basePrazo": self.base_prazo,
            "vendaMin": self.venda_min,
            "vendaMax": self.venda_max,
            "descMax": self.desc_max,
            "percMinEntrada": self.perc_min_entrada,
            "statusTipo": self.status_tipo,
        }
