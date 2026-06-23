import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.config import settings
from sqlalchemy import text
from app.core.auth import hash_password
from app.models.cliente import Cliente
from app.models.produto import Produto
from app.models.pedido import Pedido, PedidoItem
from app.models.vendedor import Vendedor
from app.models.transportadora import Transportadora
from app.models.regra import RegraNegocio
from app.models.carteira import CarteiraCliente
from app.models.empresa import Empresa
from app.models.preco_produto import PrecoProduto
from app.models.tipo_negociacao import TipoNegociacao
from app.models.tipo_operacao import TipoOperacao
from app.models.sync_log import SyncLog
from app.schemas.sync import SyncResult
from app.services.erp_client import ERPClient, ERPClientError
from app.services.mapper import (
    _safe_int,
    map_cliente,
    map_endereco_to_cliente,
    map_produto,
    map_logistica_to_produto,
    map_pedido,
    map_pedido_item,
    map_vendedor,
    map_transportadora,
    map_carteira,
    map_empresa,
    map_preco_produto,
    map_tipo_negociacao,
    map_tipo_operacao,
)

logger = logging.getLogger(__name__)

MODULES = [
    "vendedores",
    "carteira",
    "empresas",
    "vendedor-empresas",
    "transportadoras",
    "financeiro",
    "tipos-negociacao",
    "tipos-operacao",
    "produtos",
    "precos",
    "clientes",
    "pedidos",
]


class SyncService:
    def __init__(self):
        self.erp = ERPClient()
        self._lock = asyncio.Lock()

    async def sync_module(self, modulo: str, db: Session | None = None, tipo: str = "incremental", meses: int = 6) -> SyncResult:
        if self._lock.locked():
            return SyncResult(modulo=modulo, registros=0, status="skipped",
                              mensagem="Sincronização já em andamento")

        async with self._lock:
            close_db = db is None
            if close_db:
                db = SessionLocal()

            try:
                registros = 0
                match modulo:
                    case "vendedores":
                        registros = await self._sync_vendedores(db)
                    case "carteira":
                        registros = await self._sync_carteira(db)
                    case "empresas":
                        registros = await self._sync_empresas(db)
                    case "vendedor-empresas":
                        registros = await self._sync_vendedor_empresas(db)
                    case "produtos":
                        registros = await self._sync_produtos(db)
                    case "precos":
                        registros = await self._sync_precos(db)
                    case "clientes":
                        registros = await self._sync_clientes(db)
                    case "pedidos":
                        registros = await self._sync_pedidos(db, meses=meses)
                    case "transportadoras":
                        registros = await self._sync_transportadoras(db)
                    case "financeiro":
                        registros = await self._sync_financeiro(db)
                    case "tipos-negociacao":
                        registros = await self._sync_tipos_negociacao(db)
                    case "tipos-operacao":
                        registros = await self._sync_tipos_operacao(db)
                    case _:
                        return SyncResult(modulo=modulo, registros=0, status="error", mensagem="Modulo desconhecido")

                log = SyncLog(modulo=modulo, tipo=tipo, registros=registros, status="success")
                db.add(log)
                db.commit()

                return SyncResult(modulo=modulo, registros=registros, status="success")

            except ERPClientError as e:
                log = SyncLog(modulo=modulo, tipo=tipo, registros=0, status="error", mensagem=str(e))
                db.add(log)
                db.commit()
                return SyncResult(modulo=modulo, registros=0, status="error", mensagem=str(e))

            except Exception as e:
                db.rollback()
                logger.exception(f"Sync error on {modulo}")
                return SyncResult(modulo=modulo, registros=0, status="error", mensagem=str(e))

            finally:
                if close_db:
                    db.close()

    async def sync_all_modules(self, tipo: str = "incremental") -> list[SyncResult]:
        results = []
        for modulo in MODULES:
            result = await self.sync_module(modulo, tipo=tipo)
            results.append(result)
        return results

    async def _sync_vendedores(self, db: Session) -> int:
        data = await self.erp.get_vendedores()
        count = 0
        default_senha = hash_password("1234")
        for item in data:
            v = map_vendedor(item)
            existing = db.query(Vendedor).filter(Vendedor.id == v.id).first()
            if existing:
                existing.nome = v.nome
                existing.tipo = v.tipo
                existing.gerente_id = v.gerente_id
                existing.ativo = v.ativo
                existing.email = v.email
                if not existing.senha:
                    existing.senha = default_senha
                existing.updated_at = v.updated_at
            else:
                v.senha = default_senha
                db.add(Vendedor(**v.model_dump()))
            count += 1
        db.commit()
        return count

    async def _sync_vendedor_empresas(self, db: Session) -> int:
        result = db.execute(text("""
            INSERT INTO vendedor_empresas (vendedor_id, empresa_id)
            SELECT v.id, e.id FROM vendedores v, empresas e
            WHERE e.ativo = true
            AND NOT EXISTS (
                SELECT 1 FROM vendedor_empresas ve
                WHERE ve.vendedor_id = v.id AND ve.empresa_id = e.id
            )
        """))
        db.commit()
        count = result.rowcount
        logger.info("Vendedor-empresas linked: %d new links", count)
        return count

    async def _sync_carteira(self, db: Session) -> int:
        data = await self.erp.get_carteira()
        if not data or len(data) == 0:
            logger.warning("Carteira returned empty from ERP, skipping delete to preserve local data")
            return 0
        db.query(CarteiraCliente).delete()
        db.flush()
        count = 0
        for item in data:
            c = map_carteira(item)
            db.add(CarteiraCliente(**c.model_dump()))
            count += 1
        db.commit()
        logger.info("Carteira synced: %d records", count)
        return count

    async def _sync_empresas(self, db: Session) -> int:
        data = await self.erp.get_empresas()
        count = 0
        for item in data:
            e = map_empresa(item)
            existing = db.query(Empresa).filter(Empresa.id == e.id).first()
            if existing:
                existing.razao_social = e.razao_social
                existing.cnpj = e.cnpj
                existing.cidade = e.cidade
                existing.uf = e.uf
                existing.ativo = e.ativo
            else:
                db.add(Empresa(**e.model_dump()))
            count += 1
        db.commit()
        return count

    async def _sync_precos(self, db: Session) -> int:
        tabelas = await self.erp.get_tabelas_preco()
        if not tabelas:
            return 0

        total = 0
        for tab in tabelas:
            codtab = tab.get("codtab")
            codemp = tab.get("codemp")
            if not codtab or not codemp:
                continue

            precos = await self.erp.get_precos(codtab=codtab)
            if not precos:
                continue

            db.query(PrecoProduto).filter(
                PrecoProduto.empresa_id == int(codemp),
                PrecoProduto.codtab == codtab,
            ).delete()
            db.flush()

            for item in precos:
                p = map_preco_produto(int(codemp), item)
                if p.preco > 0 and p.produto_id > 0:
                    db.add(PrecoProduto(**p.model_dump()))
                    total += 1

        db.commit()
        return total

    async def _sync_produtos(self, db: Session) -> int:
        data = await self.erp.get_produtos()
        logistica_list = await self.erp.get_produtos_logistica()
        logistica_map = {p["codprod"]: p for p in logistica_list if p.get("codprod")}

        count = 0
        for item in data:
            p = map_produto(item)
            codprod = p.id
            if codprod in logistica_map:
                p = map_logistica_to_produto(p, logistica_map[codprod])

            existing = db.query(Produto).filter(Produto.id == p.id).first()
            if existing:
                for key, val in p.model_dump(exclude_unset=True).items():
                    if hasattr(existing, key) and val is not None:
                        setattr(existing, key, val)
            else:
                db.add(Produto(**p.model_dump()))
            count += 1
        db.commit()
        return count

    async def _sync_clientes(self, db: Session) -> int:
        data = await self.erp.get_clientes()
        enderecos = await self.erp.get_enderecos()
        endereco_map: dict[int, dict] = {}
        for e in enderecos:
            codparc = e.get("codparc")
            if codparc and codparc not in endereco_map:
                endereco_map[codparc] = e

        count = 0
        for item in data:
            c = map_cliente(item)
            codparc = c.id
            if codparc in endereco_map:
                c = map_endereco_to_cliente(c, endereco_map[codparc])

            existing = db.query(Cliente).filter(Cliente.id == c.id).first()
            if existing:
                for key, val in c.model_dump(exclude_unset=True).items():
                    if hasattr(existing, key) and val is not None:
                        setattr(existing, key, val)
            else:
                db.add(Cliente(**c.model_dump()))
            count += 1
        db.commit()
        return count

    async def _sync_pedidos(self, db: Session, meses: int = 6) -> int:
        from datetime import datetime, timedelta, timezone

        data_limite = datetime.now(timezone.utc) - timedelta(days=meses * 30)

        if meses > 0:
            old_items = db.execute(
                text("DELETE FROM pedido_itens WHERE pedido_id IN (SELECT id FROM pedidos WHERE data < :limite)"),
                {"limite": data_limite},
            )
            old_ped = db.execute(
                text("DELETE FROM pedidos WHERE data < :limite"),
                {"limite": data_limite},
            )
            db.commit()
            logger.info("Pedidos antigos removidos: %d itens, %d pedidos (meses=%d)", old_items.rowcount, old_ped.rowcount, meses)

        data = await self.erp.get_pedidos()

        if meses > 0:
            data_limite_str = data_limite.strftime("%d%m%Y")
            total_raw = len(data)
            data = [p for p in data if p.get("dtneg", "")[:8] >= data_limite_str]
            logger.info("Pedidos filtrados por dtneg>=%s: %d de %d", data_limite_str, len(data), total_raw)

        count = 0
        last_log = 0
        for item in data:
            p = map_pedido(item)
            existing = db.query(Pedido).filter(Pedido.id == p.id).first()
            if not existing:
                pedido = Pedido(**p.model_dump(exclude={"itens"}))
                db.add(pedido)
                db.flush()
                try:
                    itens = await self.erp.get_pedido_itens(p.id)
                    for it in itens:
                        item_model = map_pedido_item(it)
                        db.add(PedidoItem(pedido_id=p.id, **item_model.model_dump()))
                except Exception:
                    logger.exception(f"Error fetching items for pedido {p.id}")
            else:
                for key, val in p.model_dump(exclude={"itens"}, exclude_unset=True).items():
                    if hasattr(existing, key) and val is not None:
                        setattr(existing, key, val)
            count += 1
            if count - last_log >= 500:
                db.commit()
                logger.info("Pedidos synced: %d so far (batch commit)", count)
                last_log = count
        db.commit()
        logger.info("Pedidos sync complete: %d total", count)
        return count

    async def _sync_transportadoras(self, db: Session) -> int:
        data = await self.erp.get_transportadoras()

        dedup: dict[int, dict] = {}
        for item in data:
            codparc = _safe_int(item.get("codparc"))
            if codparc in dedup:
                if item.get("ativo") == "S":
                    dedup[codparc] = item
            else:
                dedup[codparc] = item

        count = 0
        for item in dedup.values():
            t = map_transportadora(item)
            existing = db.query(Transportadora).filter(Transportadora.id == t.id).first()
            if existing:
                for key, val in t.model_dump(exclude_unset=True).items():
                    if hasattr(existing, key) and val is not None:
                        setattr(existing, key, val)
            else:
                db.add(Transportadora(**t.model_dump()))
            count += 1
        db.commit()
        logger.info("Transportadoras synced: %d records (dedup %d -> %d)", count, len(data), len(dedup))
        return count

    async def _sync_financeiro(self, db: Session) -> int:
        data = await self.erp.get_financeiro()
        return len(data)

    async def _sync_tipos_negociacao(self, db: Session) -> int:
        data = await self.erp.get_tipos_negociacao()
        if not data or len(data) == 0:
            logger.warning("Tipos-negociacao returned empty from ERP, skipping delete to preserve local data")
            return 0

        seen_ids = set()
        unique_data = []
        for item in data:
            id_val = item.get("codtipvenda")
            if id_val not in seen_ids:
                seen_ids.add(id_val)
                unique_data.append(item)

        db.query(TipoNegociacao).delete()
        db.flush()
        count = 0
        for item in unique_data:
            t = map_tipo_negociacao(item)
            db.add(TipoNegociacao(**t.model_dump()))
            count += 1
        db.commit()
        logger.info("Tipos-negociacao synced: %d records", count)
        return count

    async def _sync_tipos_operacao(self, db: Session) -> int:
        data = await self.erp.get_tipos_operacao()
        if not data or len(data) == 0:
            logger.warning("Tipos-operacao returned empty from ERP, skipping delete to preserve local data")
            return 0

        seen_ids = set()
        unique_data = []
        for item in data:
            id_val = item.get("codtipoper")
            if id_val not in seen_ids:
                seen_ids.add(id_val)
                unique_data.append(item)

        db.query(TipoOperacao).delete()
        db.flush()
        count = 0
        for item in unique_data:
            t = map_tipo_operacao(item)
            db.add(TipoOperacao(**t.model_dump()))
            count += 1
        db.commit()
        logger.info("Tipos-operacao synced: %d records", count)
        return count

    def get_status(self, db: Session) -> dict:
        last_log = db.query(SyncLog).order_by(SyncLog.created_at.desc()).first()
        last_full = (
            db.query(SyncLog)
            .filter(SyncLog.tipo == "full", SyncLog.status == "success")
            .order_by(SyncLog.created_at.desc())
            .first()
        )
        last_results = (
            db.query(SyncLog)
            .filter(SyncLog.status == "success")
            .order_by(SyncLog.created_at.desc())
            .limit(50)
            .all()
        )

        modules_status = {}
        for log in last_results:
            if log.modulo not in modules_status:
                modules_status[log.modulo] = SyncResult(
                    modulo=log.modulo,
                    registros=log.registros,
                    status=log.status,
                    mensagem=log.mensagem,
                )

        return {
            "is_syncing": self._lock.locked(),
            "last_sync": last_log.created_at.isoformat() if last_log else None,
            "last_full_sync": last_full.created_at.isoformat() if last_full else None,
            "modules": {k: v.model_dump() for k, v in modules_status.items()},
        }
