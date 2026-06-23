from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.cliente import Cliente
from app.models.produto import Produto
from app.models.pedido import Pedido, PedidoItem
from app.models.vendedor import Vendedor
from app.models.transportadora import Transportadora
from app.models.regra import RegraNegocio
from app.models.carteira import CarteiraCliente
from app.models.sync_log import SyncLog
from app.models.empresa import Empresa
from app.models.preco_produto import PrecoProduto
from app.models.business_rule import BusinessRule
from app.models.tipo_negociacao import TipoNegociacao
from app.models.tipo_operacao import TipoOperacao
from app.services.erp_client import ERPClient
from app.services.business_rules_engine import BusinessRulesEngine
from app.services.order_validator import OrderValidator
from app.schemas.business_rule import BusinessRuleCreate, BusinessRuleResponse
from app.schemas.pedido import PedidoCreate, PedidoItemCreate

router = APIRouter(prefix="/api/v1/erp", tags=["erp-proxy"])


@router.get("/status")
async def erp_status(current_user: dict = Depends(get_current_user)):
    client = ERPClient()
    result = await client.test_connection()
    return result


@router.get("/clientes")
async def get_clientes(
    vendedor_id: int | None = Query(None),
    tipo: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if tipo == "A" or vendedor_id == 0:
        clientes = db.query(Cliente).filter(Cliente.ativo == True).all()
    else:
        clientes = (
            db.query(Cliente)
            .join(CarteiraCliente, CarteiraCliente.cliente_id == Cliente.id)
            .filter(
                CarteiraCliente.vendedor_id == vendedor_id,
                Cliente.ativo == True,
            )
            .distinct()
            .all()
        )
    return {"success": True, "data": [c.to_dict() for c in clientes], "total": len(clientes)}


@router.get("/produtos")
async def get_produtos(
    empresa_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    produtos = db.query(Produto).filter(Produto.ativo == True).all()
    if empresa_id is not None:
        precos_rows = db.query(PrecoProduto).filter(
            PrecoProduto.empresa_id == empresa_id, PrecoProduto.preco > 0
        ).all()
        precos_map = {pp.produto_id: pp.preco for pp in precos_rows}
        data = []
        for p in produtos:
            d = p.to_dict()
            d["precoBase"] = precos_map.get(p.id, 0.0)
            data.append(d)
        return {"success": True, "data": data, "total": len(data)}
    else:
        return {"success": True, "data": [p.to_dict() for p in produtos], "total": len(produtos)}


@router.get("/empresas")
async def list_empresas(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    empresas = db.query(Empresa).filter(Empresa.ativo == True).all()
    return {"success": True, "data": [e.to_dict() for e in empresas], "total": len(empresas)}


@router.get("/empresas/{empresa_id}/produtos")
async def get_empresa_produtos(empresa_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    rows = (
        db.query(Produto, PrecoProduto.preco)
        .join(PrecoProduto, PrecoProduto.produto_id == Produto.id)
        .filter(
            PrecoProduto.empresa_id == empresa_id,
            Produto.ativo == True,
            PrecoProduto.preco > 0,
        )
        .all()
    )
    result = []
    for prod, preco in rows:
        d = prod.to_dict()
        d["precoBase"] = preco
        result.append(d)
    return {"success": True, "data": result, "total": len(result)}


@router.get("/pedidos")
async def get_pedidos(
    vendedor_id: int | None = Query(None),
    tipo: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    q = db.query(Pedido).options(joinedload(Pedido.itens))
    if vendedor_id is not None and vendedor_id != 0 and tipo != "A":
        q = q.filter(Pedido.vendedor_id == vendedor_id)
    pedidos = q.order_by(Pedido.data.desc()).limit(100).all()
    return {"success": True, "data": [p.to_dict() for p in pedidos], "total": len(pedidos)}


@router.get("/vendedores")
async def get_vendedores(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    vendedores = db.query(Vendedor).filter(Vendedor.ativo == True).all()
    return {"success": True, "data": [v.to_dict() for v in vendedores], "total": len(vendedores)}


@router.get("/transportadoras")
async def get_transportadoras(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    transportadoras = db.query(Transportadora).filter(Transportadora.ativo == True).all()
    return {"success": True, "data": [t.to_dict() for t in transportadoras], "total": len(transportadoras)}


@router.get("/carteira")
async def get_carteira(codvend: int | None = Query(None), db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    q = db.query(CarteiraCliente)
    if codvend:
        q = q.filter(CarteiraCliente.vendedor_id == codvend)
    carteira = q.all()
    return {"success": True, "data": [c.to_dict() for c in carteira], "total": len(carteira)}


@router.get("/regras")
async def get_regras(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    regra = db.query(RegraNegocio).first()
    if not regra:
        return {"success": True, "data": None}
    return {"success": True, "data": regra.to_dict()}


@router.put("/regras")
async def update_regras(data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    regra = db.query(RegraNegocio).first()
    if not regra:
        regra = RegraNegocio()
        db.add(regra)
    CAMEL_TO_SNAKE_REGRA = {
        "descontoMaximo": "desconto_maximo",
        "pedidoMinimo": "pedido_minimo",
        "bloqueioInadimplencia": "bloqueio_inadimplencia",
        "comissaoPadrao": "comissao_padrao",
        "prazoMaximo": "prazo_maximo",
        "validarEstoque": "validar_estoque",
        "permitirVendaSemEstoque": "permitir_venda_sem_estoque",
        "nfAutomatica": "nf_automatica",
        "aprovarDescontoAcima": "aprovar_desconto_acima",
        "pedidoMinimoRepresentante": "pedido_minimo_representante",
        "creditoAutomatico": "credito_automatico",
        "multiploVenda": "multiplo_venda",
    }
    for key, val in data.items():
        snake_key = CAMEL_TO_SNAKE_REGRA.get(key, key)
        if snake_key == "id":
            continue
        if hasattr(regra, snake_key):
            setattr(regra, snake_key, val)
    db.commit()
    db.refresh(regra)
    return {"success": True, "data": regra.to_dict()}


@router.get("/sync-logs")
async def get_sync_logs(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    logs = db.query(SyncLog).order_by(SyncLog.created_at.desc()).limit(50).all()
    return {"success": True, "data": [l.to_dict() for l in logs], "total": len(logs)}


@router.get("/tipos-negociacao")
async def get_tipos_negociacao(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    tipos = db.query(TipoNegociacao).filter(TipoNegociacao.ativo == True).all()
    return {"success": True, "data": [t.to_dict() for t in tipos], "total": len(tipos)}


@router.get("/tipos-operacao")
async def get_tipos_operacao(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    tipos = db.query(TipoOperacao).filter(TipoOperacao.ativo == True).all()
    return {"success": True, "data": [t.to_dict() for t in tipos], "total": len(tipos)}


class ProdutoCreate(BaseModel):
    id: int
    codigo: str | None = None
    nome: str
    unidade: str | None = None
    ativo: bool = True
    grupo_id: int | None = None
    categoria: str | None = None
    ean: str | None = None
    ncm: str | None = None
    estoque: float = 0.0
    peso: float = 0.0
    altura: float = 0.0
    largura: float = 0.0
    comprimento: float = 0.0
    factory_id: int | None = None
    factory_name: str | None = None


class ProdutoUpdate(BaseModel):
    codigo: str | None = None
    nome: str | None = None
    unidade: str | None = None
    ativo: bool | None = None
    grupo_id: int | None = None
    categoria: str | None = None
    ean: str | None = None
    ncm: str | None = None
    estoque: float | None = None
    peso: float | None = None
    altura: float | None = None
    largura: float | None = None
    comprimento: float | None = None
    factory_id: int | None = None
    factory_name: str | None = None


class ClienteCreate(BaseModel):
    id: int
    razao_social: str
    nome_fantasia: str | None = None
    cnpj: str | None = None
    ie: str | None = None
    email: str | None = None
    telefone: str | None = None
    cep: str | None = None
    logradouro: str | None = None
    numero: str | None = None
    bairro: str | None = None
    cidade: str | None = None
    uf: str | None = None
    limite_credito: float = 0.0
    codigo_vendedor: int | None = None
    ativo: bool = True


class ClienteUpdate(BaseModel):
    razao_social: str | None = None
    nome_fantasia: str | None = None
    cnpj: str | None = None
    ie: str | None = None
    email: str | None = None
    telefone: str | None = None
    cep: str | None = None
    logradouro: str | None = None
    numero: str | None = None
    bairro: str | None = None
    cidade: str | None = None
    uf: str | None = None
    limite_credito: float | None = None
    codigo_vendedor: int | None = None
    ativo: bool | None = None


class TransportadoraCreate(BaseModel):
    id: int
    razao_social: str | None = None
    nome: str
    cnpj: str | None = None
    ie: str | None = None
    tipo_frete: str | None = None
    cep: str | None = None
    telefone: str | None = None
    email: str | None = None
    ativo: bool = True


class TransportadoraUpdate(BaseModel):
    razao_social: str | None = None
    nome: str | None = None
    cnpj: str | None = None
    ie: str | None = None
    tipo_frete: str | None = None
    cep: str | None = None
    telefone: str | None = None
    email: str | None = None
    ativo: bool | None = None


class PedidoStatusUpdate(BaseModel):
    status: str


class PedidoValidateItem(BaseModel):
    produtoId: int
    produtoNome: str = ""
    referencia: str | None = None
    quantidade: float = 0.0
    valorUnitario: float = 0.0
    valorTotal: float = 0.0
    desconto: float = 0.0
    descontoPercentual: float = 0.0


class PedidoValidate(BaseModel):
    clienteId: int
    vendedorId: int
    valorTotal: float = 0.0
    pagamento: str = ""
    itens: list[PedidoValidateItem] = []


@router.post("/produtos")
async def create_produto(data: ProdutoCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    existing = db.query(Produto).filter(Produto.id == data.id).first()
    if existing:
        raise HTTPException(400, "Produto com este ID já existe")
    produto = Produto(**data.model_dump())
    db.add(produto)
    db.commit()
    db.refresh(produto)
    return {"success": True, "data": produto.to_dict()}


@router.put("/produtos/{produto_id}")
async def update_produto(produto_id: int, data: ProdutoUpdate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(404, "Produto não encontrado")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(produto, key, val)
    db.commit()
    db.refresh(produto)
    return {"success": True, "data": produto.to_dict()}


@router.delete("/produtos/{produto_id}")
async def delete_produto(produto_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(404, "Produto não encontrado")
    produto.ativo = False
    db.commit()
    return {"success": True, "message": "Produto desativado"}


@router.post("/clientes")
async def create_cliente(data: ClienteCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if data.id is not None:
        existing = db.query(Cliente).filter(Cliente.id == data.id).first()
        if existing:
            raise HTTPException(400, "Cliente com este ID já existe")
    dump = data.model_dump(exclude_unset=True)
    cliente = Cliente(**dump)
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return {"success": True, "data": cliente.to_dict()}


@router.put("/clientes/{cliente_id}")
async def update_cliente(cliente_id: int, data: ClienteUpdate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(404, "Cliente não encontrado")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(cliente, key, val)
    db.commit()
    db.refresh(cliente)
    return {"success": True, "data": cliente.to_dict()}


@router.delete("/clientes/{cliente_id}")
async def delete_cliente(cliente_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(404, "Cliente não encontrado")
    cliente.ativo = False
    db.commit()
    return {"success": True, "message": "Cliente desativado"}


@router.post("/transportadoras")
async def create_transportadora(data: TransportadoraCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    existing = db.query(Transportadora).filter(Transportadora.id == data.id).first()
    if existing:
        raise HTTPException(400, "Transportadora com este ID já existe")
    transp = Transportadora(**data.model_dump())
    db.add(transp)
    db.commit()
    db.refresh(transp)
    return {"success": True, "data": transp.to_dict()}


@router.put("/transportadoras/{transp_id}")
async def update_transportadora(transp_id: int, data: TransportadoraUpdate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    transp = db.query(Transportadora).filter(Transportadora.id == transp_id).first()
    if not transp:
        raise HTTPException(404, "Transportadora não encontrada")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(transp, key, val)
    db.commit()
    db.refresh(transp)
    return {"success": True, "data": transp.to_dict()}


@router.delete("/transportadoras/{transp_id}")
async def delete_transportadora(transp_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    transp = db.query(Transportadora).filter(Transportadora.id == transp_id).first()
    if not transp:
        raise HTTPException(404, "Transportadora não encontrada")
    transp.ativo = False
    db.commit()
    return {"success": True, "message": "Transportadora desativada"}


@router.post("/pedidos")
async def create_pedido(data: PedidoCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # Server-side validation of business rules
    validator = OrderValidator(db)
    validation = validator.validate({
        "cliente_id": data.cliente_id,
        "vendedor_id": data.vendedor_id,
        "valor_total": data.valor_total,
        "pagamento": data.pagamento,
        "itens": [item.model_dump(by_alias=True) for item in (data.itens or [])],
    })

    if not validation.valid:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Regras de negócio não atendidas",
                "errors": [{"field": e.field, "message": e.message, "code": e.code} for e in validation.errors],
                "warnings": [{"field": w.field, "message": w.message, "code": w.code} for w in validation.warnings],
            }
        )

    pedido = Pedido(
        id=data.id,
        numero=data.numero,
        cliente_id=data.cliente_id,
        cliente_nome=data.cliente_nome,
        vendedor_id=data.vendedor_id,
        vendedor_nome=data.vendedor_nome,
        transportadora_id=data.transportadora_id,
        pagamento=data.pagamento,
        valor_total=data.valor_total,
        status=data.status,
        data=datetime.now(),
    )
    db.add(pedido)
    db.flush()
    if pedido.numero is None:
        pedido.numero = pedido.id
    if data.itens:
        for i, item in enumerate(data.itens):
            pi = PedidoItem(
                pedido_id=pedido.id,
                sequencia=i + 1,
                produto_id=item.produto_id,
                produto_nome=item.produto_nome,
                referencia=item.referencia,
                quantidade=item.quantidade,
                valor_unitario=item.valor_unitario,
                valor_total=item.valor_total,
                desconto=item.desconto,
                desconto_percentual=item.desconto_percentual,
            )
            db.add(pi)
    db.commit()
    db.refresh(pedido)

    # Return validation warnings and engine result alongside the order
    response = pedido.to_dict()
    if validation.warnings:
        response["validationWarnings"] = [
            {"field": w.field, "message": w.message, "code": w.code}
            for w in validation.warnings
        ]
    if validation.engine_result:
        response["rulesEngineResult"] = validation.engine_result

    return {"success": True, "data": response}


# Business Rules CRUD Endpoints
@router.get("/business-rules")
async def get_business_rules(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    rules = db.query(BusinessRule).all()
    return {"success": True, "data": [rule.to_dict() for rule in rules]}


@router.post("/business-rules")
async def create_business_rule(data: BusinessRuleCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    existing = db.query(BusinessRule).filter(BusinessRule.id == data.id).first()
    if existing:
        raise HTTPException(400, "Regra com este ID já existe")
    rule = BusinessRule(
        id=data.id,
        name=data.name,
        description=data.description,
        type=data.type,
        enabled=data.enabled,
        priority=data.priority,
        product_filter=data.productFilter,
        customer_filter=data.customerFilter,
        date_range=data.dateRange,
        threshold=data.threshold,
        min_order_value=data.minOrderValue,
        min_order_quantity=data.minOrderQuantity,
        discount_type=data.discountType,
        discount_value=data.discountValue,
        deducts_from_commission=data.deductsFromCommission,
        progressive_tiers=data.progressiveTiers,
        required_product_ids=data.requiredProductIds,
        free_shipping_threshold=data.freeShippingThreshold,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        applied_count=data.appliedCount,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return {"success": True, "data": rule.to_dict()}


@router.put("/business-rules/{rule_id}")
async def update_business_rule(rule_id: str, data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    rule = db.query(BusinessRule).filter(BusinessRule.id == rule_id).first()
    if not rule:
        raise HTTPException(404, "Regra não encontrada")
    CAMEL_TO_SNAKE = {
        "productFilter": "product_filter",
        "customerFilter": "customer_filter",
        "dateRange": "date_range",
        "minOrderValue": "min_order_value",
        "minOrderQuantity": "min_order_quantity",
        "discountType": "discount_type",
        "discountValue": "discount_value",
        "deductsFromCommission": "deducts_from_commission",
        "progressiveTiers": "progressive_tiers",
        "requiredProductIds": "required_product_ids",
        "freeShippingThreshold": "free_shipping_threshold",
        "appliedCount": "applied_count",
    }
    for key, value in data.items():
        snake_key = CAMEL_TO_SNAKE.get(key, key)
        if hasattr(rule, snake_key):
            setattr(rule, snake_key, value)
    rule.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rule)
    return {"success": True, "data": rule.to_dict()}


@router.delete("/business-rules/{rule_id}")
async def delete_business_rule(rule_id: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    rule = db.query(BusinessRule).filter(BusinessRule.id == rule_id).first()
    if not rule:
        raise HTTPException(404, "Regra não encontrada")
    db.delete(rule)
    db.commit()
    return {"success": True, "message": "Regra excluída"}


@router.put("/business-rules/{rule_id}/toggle")
async def toggle_business_rule(rule_id: str, data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    rule = db.query(BusinessRule).filter(BusinessRule.id == rule_id).first()
    if not rule:
        raise HTTPException(404, "Regra não encontrada")
    enabled = data.get("enabled", not rule.enabled)
    rule.enabled = enabled
    rule.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rule)
    return {"success": True, "data": rule.to_dict()}


@router.post("/pedidos/validate")
async def validate_pedido(data: PedidoValidate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    validator = OrderValidator(db)
    validation = validator.validate({
        "cliente_id": data.clienteId,
        "vendedor_id": data.vendedorId,
        "valor_total": data.valorTotal,
        "pagamento": data.pagamento,
        "itens": [
            {
                "produtoId": item.produtoId,
                "produtoNome": item.produtoNome,
                "referencia": item.referencia,
                "quantidade": item.quantidade,
                "valorUnitario": item.valorUnitario,
                "valorTotal": item.valorTotal,
                "desconto": item.desconto,
                "descontoPercentual": item.descontoPercentual,
            }
            for item in data.itens
        ],
    })
    return {
        "success": True,
        "valid": validation.valid,
        "errors": [{"field": e.field, "message": e.message, "code": e.code} for e in validation.errors],
        "warnings": [{"field": w.field, "message": w.message, "code": w.code} for w in validation.warnings],
        "engineResult": validation.engine_result,
    }


@router.put("/pedidos/{pedido_id}/status")
async def update_pedido_status(pedido_id: int, data: PedidoStatusUpdate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(404, "Pedido não encontrado")
    pedido.status = data.status
    db.commit()
    db.refresh(pedido)
    return {"success": True, "data": pedido.to_dict()}
