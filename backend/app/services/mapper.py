from datetime import datetime

from app.schemas.cliente import ClienteCreate
from app.schemas.produto import ProdutoCreate
from app.schemas.pedido import PedidoCreate, PedidoItemCreate
from app.schemas.vendedor import VendedorCreate
from app.schemas.transportadora import TransportadoraCreate
from app.schemas.regra import RegraNegocioCreate
from app.schemas.carteira import CarteiraClienteCreate
from app.schemas.empresa import EmpresaCreate
from app.schemas.preco_produto import PrecoProdutoCreate
from app.schemas.tipo_negociacao import TipoNegociacaoCreate
from app.schemas.tipo_operacao import TipoOperacaoCreate


def _safe_int(value, default=0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _safe_float(value, default=0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _bool_sim_nao(value) -> bool:
    if isinstance(value, str):
        return value.upper() == "S"
    return bool(value)


def _parse_dtalter(dtalter: str | None) -> datetime | None:
    if not dtalter:
        return None
    try:
        return datetime.strptime(dtalter.strip(), "%d%m%Y %H:%M:%S")
    except ValueError:
        pass
    try:
        return datetime.strptime(dtalter.strip(), "%Y-%m-%d")
    except ValueError:
        return None


def _strip(value: str | None) -> str | None:
    if value and isinstance(value, str):
        return value.strip()
    return value


def map_cliente(data: dict) -> ClienteCreate:
    return ClienteCreate(
        id=_safe_int(data.get("codparc")),
        razao_social=_strip(data.get("razaosocial")) or "",
        nome_fantasia=_strip(data.get("nomeparc")),
        cnpj=_strip(data.get("cgc_cpf")),
        ie=_strip(data.get("identinscestad")),
        suframa=_strip(data.get("codsuframa")),
        codigo_vendedor=_safe_int(data.get("codvend"), None),
        simples_nacional=_bool_sim_nao(data.get("simples")),
        tipo_parceiro=_strip(data.get("tipo_parceiro")),
        ativo=True,
        updated_at=_parse_dtalter(data.get("dtalter")),
    )


def map_endereco_to_cliente(cliente: ClienteCreate, endereco: dict | None) -> ClienteCreate:
    if not endereco:
        return cliente
    cliente.cep = _strip(endereco.get("cep"))
    cliente.logradouro = _strip(endereco.get("nomeend"))
    cliente.numero = _strip(endereco.get("numend"))
    cliente.complemento = _strip(endereco.get("complemento"))
    cliente.bairro = _strip(endereco.get("nomebai"))
    cliente.cidade = _strip(endereco.get("nomecid"))
    cliente.uf = _strip(endereco.get("uf_sigla"))
    cliente.email = _strip(endereco.get("email"))
    cliente.email_nfe = _strip(endereco.get("emailnfe"))
    cliente.telefone = _strip(endereco.get("telefone"))
    return cliente


def map_produto(data: dict) -> ProdutoCreate:
    return ProdutoCreate(
        id=_safe_int(data.get("codprod")),
        codigo=str(data.get("codprod", "")),
        referencia=_strip(data.get("referencia")),
        nome=_strip(data.get("descrprod", "")),
        unidade=_strip(data.get("codvol")),
        ativo=_bool_sim_nao(data.get("ativo")),
        grupo_id=_safe_int(data.get("codgrupoprod"), None),
        categoria=_strip(data.get("descrgrupoprod")),
        ean=_strip(data.get("ean13")),
        ncm=_strip(data.get("ncm")),
        usoprod=_strip(data.get("usoprod")),
        status_produto=_strip(data.get("status_produto")),
        estoque=_safe_float(data.get("estdisp")),
    )


def map_logistica_to_produto(produto: ProdutoCreate, logistica: dict | None) -> ProdutoCreate:
    if not logistica:
        return produto
    produto.peso = _safe_float(logistica.get("pesobruto"))
    produto.altura = _safe_float(logistica.get("altura"))
    produto.largura = _safe_float(logistica.get("largura"))
    produto.comprimento = _safe_float(logistica.get("espessura"))
    produto.metro_cubico = _safe_float(logistica.get("cubagemunit"))
    produto.qtd_caixa = _safe_int(logistica.get("qtdemb"), 1)
    produto.multiplo_venda = _safe_float(logistica.get("agrupmin"), 1.0)
    return produto


def map_pedido(data: dict) -> PedidoCreate:
    return PedidoCreate(
        id=_safe_int(data.get("nunota")),
        numero=_safe_int(data.get("numnota"), None),
        cliente_id=_safe_int(data.get("codparc"), None),
        cliente_nome=_strip(data.get("nomeparc")),
        vendedor_id=_safe_int(data.get("codvend"), None),
        vendedor_nome=_strip(data.get("apelido")),
        data=_parse_dtalter(data.get("dtneg")),
        valor_total=_safe_float(data.get("vlrnota")),
        status="pendente",
        tipo_operacao_id=_safe_int(data.get("codtipoper"), None),
        tipo_operacao=_strip(data.get("descroper")),
        updated_at=_parse_dtalter(data.get("dtalter")),
    )


def map_pedido_item(data: dict) -> PedidoItemCreate:
    vlrtot = _safe_float(data.get("vlrtot"))
    vlrdesc = _safe_float(data.get("vlrdesc"))
    desconto_pct = (vlrdesc / vlrtot * 100) if vlrtot > 0 else 0.0
    return PedidoItemCreate(
        sequencia=_safe_int(data.get("sequencia"), None),
        produto_id=_safe_int(data.get("codprod"), None),
        produto_nome=_strip(data.get("descrprod")),
        referencia=_strip(data.get("referencia")),
        quantidade=_safe_float(data.get("qtdneg")),
        valor_unitario=_safe_float(data.get("vlrunit")),
        valor_total=vlrtot,
        desconto=vlrdesc,
        desconto_percentual=round(desconto_pct, 2),
        pendente=_strip(data.get("pendente", "N")),
        controle=_strip(data.get("controle")),
        updated_at=_parse_dtalter(data.get("dtalter")),
    )


def map_vendedor(data: dict) -> VendedorCreate:
    return VendedorCreate(
        id=_safe_int(data.get("codvend")),
        nome=_strip(data.get("apelido", "")),
        tipo=_strip(data.get("tipvend")),
        gerente_id=_safe_int(data.get("codger"), None),
        ativo=_bool_sim_nao(data.get("ativo")),
        email=_strip(data.get("email")),
        senha="",
        updated_at=_parse_dtalter(data.get("dtalter")),
    )


def map_transportadora(data: dict) -> TransportadoraCreate:
    return TransportadoraCreate(
        id=_safe_int(data.get("codparc")),
        razao_social=_strip(data.get("razaosocial")),
        nome=_strip(data.get("nomeparc", "")),
        cnpj=_strip(data.get("cgc_cpf")),
        ie=_strip(data.get("identinscestad")),
        tipo_frete=_strip(data.get("tiptransp")),
        cep=_strip(data.get("cep")),
        telefone=_strip(data.get("telefone")),
        email=_strip(data.get("email")),
        perfil=_strip(data.get("perfil_transportadora")),
        ativo=_bool_sim_nao(data.get("ativo")),
    )


def map_carteira(data: dict) -> CarteiraClienteCreate:
    return CarteiraClienteCreate(
        vendedor_id=_safe_int(data.get("codvend")),
        vendedor_nome=_strip(data.get("apelido")),
        tipo_vendedor=_strip(data.get("tipvend")),
        cliente_id=_safe_int(data.get("codparc")),
        cliente_nome=_strip(data.get("nomeparc")),
    )


def map_empresa(data: dict) -> EmpresaCreate:
    return EmpresaCreate(
        id=_safe_int(data.get("codemp")),
        razao_social=_strip(data.get("razaoabrev")) or "",
        cnpj=_strip(data.get("cnpj")),
        cidade=_strip(data.get("cidade")),
        uf=_strip(data.get("uf")),
        ativo=True,
    )


def map_preco_produto(empresa_id: int, data: dict) -> PrecoProdutoCreate:
    return PrecoProdutoCreate(
        codtab=_safe_int(data.get("codtab")),
        empresa_id=empresa_id,
        produto_id=_safe_int(data.get("codprod")),
        preco=_safe_float(data.get("vlrvenda")),
    )


def map_tipo_negociacao(data: dict) -> TipoNegociacaoCreate:
    return TipoNegociacaoCreate(
        id=_safe_int(data.get("codtipvenda")),
        nome=_strip(data.get("descrtipvenda", "")),
        ativo=_bool_sim_nao(data.get("ativo")),
        parcelas=_safe_int(data.get("nroparcelas"), 1),
        prazo_min=_safe_int(data.get("prazomin"), 0),
        prazo_max=_safe_int(data.get("prazomax"), 0),
        prazo_max_pri_parcela=_safe_int(data.get("prazomaxpriparc"), 0),
        taxa_juro=_safe_float(data.get("taxajuro"), 0.0),
        base_prazo=_safe_int(data.get("baseprazo"), 0),
        venda_min=_safe_float(data.get("vendamin"), 0.0),
        venda_max=_safe_float(data.get("vendamax"), 0.0),
        desc_max=_safe_float(data.get("descmax"), 0.0),
        perc_min_entrada=_safe_float(data.get("percminentrada"), 0.0),
        status_tipo=_strip(data.get("status_tipo")),
    )


def map_tipo_operacao(data: dict) -> TipoOperacaoCreate:
    return TipoOperacaoCreate(
        id=_safe_int(data.get("codtipoper")),
        nome=_strip(data.get("descroper", "")),
        tipo_movimento=_strip(data.get("tipmov")),
        ativo=_bool_sim_nao(data.get("ativo")),
        status_operacao=_strip(data.get("status_operacao")),
    )
