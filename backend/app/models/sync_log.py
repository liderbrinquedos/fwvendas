from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, DateTime

from app.core.database import Base


class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    modulo = Column(String(50), nullable=False)
    tipo = Column(String(20), default="incremental")
    registros = Column(Integer, default=0)
    status = Column(String(20), default="success")
    mensagem = Column(String(500))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "modulo": self.modulo,
            "tipo": self.tipo,
            "registros": self.registros,
            "status": self.status,
            "mensagem": self.mensagem,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }