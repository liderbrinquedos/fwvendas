from datetime import datetime, timezone
from sqlalchemy.orm import Session

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
from app.models.vendedor_empresa import VendedorEmpresa
from app.models.business_rule import BusinessRule


def _migrate_passwords(db: Session):
    for v in db.query(Vendedor).filter(Vendedor.senha.isnot(None)).all():
        if v.senha and not v.senha.startswith("$2"):
            v.senha = hash_password(v.senha)
    db.commit()


def seed_database(db: Session):
    if db.query(Vendedor).count() > 0:
        _migrate_passwords(db)
        return

    now = datetime.now(timezone.utc)

    default_hash = hash_password("1234")
    vendedores = [
        Vendedor(id=1, nome="Carlos Silva", tipo="R", gerente_id=None, ativo=True, senha=default_hash, updated_at=now),
        Vendedor(id=2, nome="Ana Costa", tipo="R", gerente_id=None, ativo=True, senha=default_hash, updated_at=now),
        Vendedor(id=3, nome="Roberto Lima", tipo="V", gerente_id=1, ativo=True, senha=default_hash, updated_at=now),
        Vendedor(id=4, nome="Fernanda Reis", tipo="V", gerente_id=1, ativo=True, senha=default_hash, updated_at=now),
        Vendedor(id=5, nome="Paulo Mendes", tipo="R", gerente_id=None, ativo=True, senha=default_hash, updated_at=now),
    ]
    db.add_all(vendedores)
    db.flush()

    transportadoras = [
        Transportadora(id=1, razao_social="TransRapido Logistica Ltda", nome="TransRapido Logistica", cnpj="11111111000111", tipo_frete="CIF/FOB", cep="01001000", telefone="1134567890", regioes="Sudeste, Sul", prazo="1-3 dias", ativo=True),
        Transportadora(id=2, razao_social="JadLog Transportes S/A", nome="JadLog Transportes", cnpj="22222222000122", tipo_frete="FOB", cep="02002000", telefone="1145678901", regioes="Nacional", prazo="3-7 dias", ativo=True),
        Transportadora(id=3, razao_social="Brembo Cargas Ltda", nome="Brembo Cargas", cnpj="33333333000133", tipo_frete="CIF", cep="03003000", telefone="1156789012", regioes="Sudeste", prazo="1-2 dias", ativo=True),
        Transportadora(id=4, razao_social="Expresso Nordeste Ltda", nome="Expresso Nordeste", cnpj="44444444000144", tipo_frete="CIF/FOB", cep="04004000", telefone="1167890123", regioes="Nordeste, Norte", prazo="5-10 dias", ativo=True),
        Transportadora(id=5, razao_social="CargoTech Logistica Ltda", nome="CargoTech Logistica", cnpj="55555555000155", tipo_frete="FOB", cep="05005000", telefone="1178901234", regioes="Sul, Sudeste", prazo="2-4 dias", ativo=False),
    ]
    db.add_all(transportadoras)
    db.flush()

    clientes = [
        Cliente(id=1, razao_social="Construtora Horizonte Ltda", nome_fantasia="Horizonte", cnpj="12345678000190", ie="123456789000", email="compras@horizonte.com.br", email_nfe="nfe@horizonte.com.br", telefone="1134567890", cep="01310100", logradouro="Av. Paulista", numero="1500", complemento="Sala 804", bairro="Bela Vista", cidade="Sao Paulo", uf="SP", limite_credito=150000.0, codigo_vendedor=1, ativo=True, updated_at=now),
        Cliente(id=2, razao_social="Empreendimentos Pioneiros S/A", nome_fantasia="Pioneiros", cnpj="23456789000101", ie="234567890111", email="obras@pioneiros.com.br", email_nfe="fiscal@pioneiros.com.br", telefone="3123456789", cep="30130000", logradouro="R. da Bahia", numero="600", complemento="3 andar", bairro="Centro", cidade="Belo Horizonte", uf="MG", limite_credito=200000.0, codigo_vendedor=2, ativo=True, updated_at=now),
        Cliente(id=3, razao_social="Incorporadora Vertice Ltda", nome_fantasia="Vertice Inc", cnpj="34567890000112", ie="345678901222", email="suprimentos@vertice.com.br", email_nfe="nfe@vertice.com.br", telefone="4134567890", cep="80020300", logradouro="R. XV de Novembro", numero="420", bairro="Centro", cidade="Curitiba", uf="PR", limite_credito=80000.0, codigo_vendedor=3, ativo=True, updated_at=now),
        Cliente(id=4, razao_social="Obras e Projetos Monteiro EIRELI", nome_fantasia="Monteiro Obras", cnpj="45678901000123", ie="456789012333", email="contato@monteiro.com.br", email_nfe="nfe@monteiro.com.br", telefone="2145678901", cep="20040020", logradouro="Av. Rio Branco", numero="89", complemento="Loja B", bairro="Centro", cidade="Rio de Janeiro", uf="RJ", limite_credito=120000.0, codigo_vendedor=2, ativo=True, updated_at=now),
        Cliente(id=5, razao_social="Construtora Athenas Ltda", nome_fantasia="Athenas", cnpj="56789012000134", ie="567890123444", suframa="2000011", email="compras@athenas.com.br", email_nfe="nf-e@athenas.com.br", telefone="7156789012", cep="69005010", logradouro="Av. Eduardo Ribeiro", numero="320", bairro="Centro", cidade="Manaus", uf="AM", limite_credito=50000.0, codigo_vendedor=1, ativo=False, updated_at=now),
        Cliente(id=6, razao_social="TechBuild Engenharia S/A", nome_fantasia="TechBuild", cnpj="67890123000145", ie="678901234555", email="obras@techbuild.com.br", email_nfe="fiscal@techbuild.com.br", telefone="4867890123", cep="88015200", logradouro="R. Felipe Schmidt", numero="215", complemento="Sala 1201", bairro="Centro", cidade="Florianopolis", uf="SC", limite_credito=180000.0, codigo_vendedor=1, ativo=True, updated_at=now),
        Cliente(id=7, razao_social="RC Construcoes EIRELI", nome_fantasia="RC Construcoes", cnpj="78901234000156", ie="789012345666", email="pedidos@rcconstrucoes.com.br", email_nfe="nfe@rcconstrucoes.com.br", telefone="1978901234", cep="13010100", logradouro="R. Barao de Jaguara", numero="540", bairro="Centro", cidade="Campinas", uf="SP", limite_credito=65000.0, codigo_vendedor=1, ativo=True, updated_at=now),
        Cliente(id=8, razao_social="Grupo Sustenta Build Ltda", nome_fantasia="Sustenta", cnpj="89012345000167", ie="890123456777", email="suprimentos@sustenta.com.br", email_nfe="nfe@sustenta.com.br", telefone="5189012345", cep="90010080", logradouro="Av. Borges de Medeiros", numero="900", complemento="Conj. 52", bairro="Centro Historico", cidade="Porto Alegre", uf="RS", limite_credito=95000.0, codigo_vendedor=5, ativo=True, updated_at=now),
    ]
    db.add_all(clientes)
    db.flush()

    produtos = [
        Produto(id=1, codigo="PRD-001", referencia="CIM-001", nome="Cimento CP-II E-32", unidade="SC", ativo=True, grupo_id=100, categoria="Cimento", ean="789100001", ncm="25231000", estoque=1500.0, estoque_min=200.0, peso=50.0, altura=60.0, largura=40.0, comprimento=15.0, metro_cubico=0.036, qtd_caixa=1, multiplo_venda=1.0, updated_at=now),
        Produto(id=2, codigo="PRD-002", referencia="CIM-002", nome="Cimento CP-V ARI", unidade="SC", ativo=True, grupo_id=100, categoria="Cimento", ean="789100002", ncm="25231000", estoque=800.0, estoque_min=100.0, peso=50.0, altura=60.0, largura=40.0, comprimento=15.0, metro_cubico=0.036, qtd_caixa=1, multiplo_venda=1.0, updated_at=now),
        Produto(id=3, codigo="PRD-003", referencia="ACO-001", nome="Aco CA-50 10mm", unidade="BR", ativo=True, grupo_id=200, categoria="Aco", ean="789100003", ncm="72142000", estoque=3000.0, estoque_min=500.0, peso=7.4, altura=10.0, largura=10.0, comprimento=1200.0, metro_cubico=0.12, qtd_caixa=1, multiplo_venda=1.0, updated_at=now),
        Produto(id=4, codigo="PRD-004", referencia="ACO-002", nome="Aco CA-60 8mm", unidade="BR", ativo=True, grupo_id=200, categoria="Aco", ean="789100004", ncm="72142000", estoque=2500.0, estoque_min=400.0, peso=4.7, altura=8.0, largura=8.0, comprimento=1200.0, metro_cubico=0.077, qtd_caixa=1, multiplo_venda=1.0, updated_at=now),
        Produto(id=5, codigo="PRD-005", referencia="TEL-001", nome="Telha Ceramica Colonial", unidade="UN", ativo=True, grupo_id=300, categoria="Cobertura", ean="789100005", ncm="69010000", estoque=12000.0, estoque_min=2000.0, peso=2.8, altura=5.0, largura=25.0, comprimento=45.0, metro_cubico=0.006, qtd_caixa=30, multiplo_venda=30.0, updated_at=now),
        Produto(id=6, codigo="PRD-006", referencia="TIJ-001", nome="Tijolo Baiano 9x19x19", unidade="ML", ativo=True, grupo_id=400, categoria="Alvenaria", ean="789100006", ncm="69041000", estoque=50.0, estoque_min=10.0, peso=2200.0, altura=9.0, largura=19.0, comprimento=19.0, metro_cubico=0.003, qtd_caixa=500, multiplo_venda=500.0, updated_at=now),
        Produto(id=7, codigo="PRD-007", referencia="ARE-001", nome="Areia Fina Lavada", unidade="M3", ativo=True, grupo_id=500, categoria="Agregados", ean="789100007", ncm="25051000", estoque=200.0, estoque_min=30.0, peso=1500.0, qtd_caixa=1, multiplo_venda=1.0, updated_at=now),
        Produto(id=8, codigo="PRD-008", referencia="BRI-001", nome="Brita 19mm", unidade="M3", ativo=True, grupo_id=500, categoria="Agregados", ean="789100008", ncm="25171000", estoque=180.0, estoque_min=25.0, peso=1600.0, qtd_caixa=1, multiplo_venda=1.0, updated_at=now),
        Produto(id=9, codigo="PRD-009", referencia="PVC-001", nome="PVC Soldavel 40mm", unidade="BR", ativo=False, grupo_id=600, categoria="Hidraulica", ean="789100009", ncm="39172300", estoque=450.0, estoque_min=80.0, peso=1.2, altura=15.0, largura=15.0, comprimento=600.0, metro_cubico=0.135, qtd_caixa=20, multiplo_venda=20.0, updated_at=now),
        Produto(id=10, codigo="PRD-010", referencia="FIO-001", nome="Fio Eletrico 2,5mm", unidade="RL", ativo=True, grupo_id=700, categoria="Eletrica", ean="789100010", ncm="85444900", estoque=90.0, estoque_min=15.0, peso=12.5, altura=30.0, largura=30.0, comprimento=30.0, metro_cubico=0.027, qtd_caixa=10, multiplo_venda=10.0, updated_at=now),
        Produto(id=11, codigo="PRD-011", referencia="DIS-001", nome="Disjuntor 32A Bipolar", unidade="UN", ativo=True, grupo_id=700, categoria="Eletrica", ean="789100011", ncm="85362000", estoque=120.0, estoque_min=20.0, peso=0.25, altura=10.0, largura=8.0, comprimento=8.0, metro_cubico=0.001, qtd_caixa=12, multiplo_venda=12.0, updated_at=now),
        Produto(id=12, codigo="PRD-012", referencia="TIN-001", nome="Tinta Acrilica 18L", unidade="LT", ativo=True, grupo_id=800, categoria="Acabamento", ean="789100012", ncm="32091000", estoque=65.0, estoque_min=10.0, peso=25.0, altura=35.0, largura=30.0, comprimento=30.0, metro_cubico=0.032, qtd_caixa=4, multiplo_venda=4.0, updated_at=now),
        Produto(id=13, codigo="PRD-013", referencia="ARG-001", nome="Argamassa AC-I 20kg", unidade="SC", ativo=True, grupo_id=800, categoria="Acabamento", ean="789100013", ncm="38245000", estoque=300.0, estoque_min=50.0, peso=20.0, altura=50.0, largura=35.0, comprimento=12.0, metro_cubico=0.021, qtd_caixa=1, multiplo_venda=1.0, updated_at=now),
        Produto(id=14, codigo="PRD-014", referencia="REB-001", nome="Rebloco 14x19x29", unidade="UN", ativo=True, grupo_id=400, categoria="Alvenaria", ean="789100014", ncm="69041000", estoque=8000.0, estoque_min=1000.0, peso=9.5, altura=14.0, largura=19.0, comprimento=29.0, metro_cubico=0.008, qtd_caixa=80, multiplo_venda=80.0, updated_at=now),
        Produto(id=15, codigo="PRD-015", referencia="VIG-001", nome="Viga Pre-Moldada 6m", unidade="UN", ativo=True, grupo_id=900, categoria="Estrutural", ean="789100015", ncm="68109900", estoque=5.0, estoque_min=10.0, peso=120.0, altura=20.0, largura=12.0, comprimento=600.0, metro_cubico=0.144, qtd_caixa=1, multiplo_venda=1.0, updated_at=now),
    ]
    db.add_all(produtos)
    db.flush()

    pedidos_data = [
        {"id": 1, "numero": 1, "cliente_id": 1, "cliente_nome": "Horizonte", "vendedor_id": 1, "vendedor_nome": "Carlos Silva", "data": datetime(2024, 11, 15, 10, 0, tzinfo=timezone.utc), "valor_total": 7330.0, "status": "faturado", "tipo_operacao_id": 50, "tipo_operacao": "PED VDA", "transportadora_id": 1, "pagamento": "30/60/90 dias",
            "itens": [
                {"sequencia": 1, "produto_id": 1, "produto_nome": "Cimento CP-II E-32", "quantidade": 200.0, "valor_unitario": 32.90, "valor_total": 6580.0, "desconto": 329.0, "desconto_percentual": 5.0},
                {"sequencia": 2, "produto_id": 7, "produto_nome": "Areia Fina Lavada", "quantidade": 10.0, "valor_unitario": 85.00, "valor_total": 850.0, "desconto": 0.0, "desconto_percentual": 0.0},
            ]},
        {"id": 2, "numero": 2, "cliente_id": 2, "cliente_nome": "Pioneiros", "vendedor_id": 2, "vendedor_nome": "Ana Costa", "data": datetime(2024, 11, 28, 14, 30, tzinfo=timezone.utc), "valor_total": 21170.0, "status": "em_separacao", "tipo_operacao_id": 50, "tipo_operacao": "PED VDA", "transportadora_id": 3, "pagamento": "A vista",
            "itens": [
                {"sequencia": 1, "produto_id": 3, "produto_nome": "Aco CA-50 10mm", "quantidade": 500.0, "valor_unitario": 28.90, "valor_total": 14450.0, "desconto": 1156.0, "desconto_percentual": 8.0},
                {"sequencia": 2, "produto_id": 4, "produto_nome": "Aco CA-60 8mm", "quantidade": 300.0, "valor_unitario": 22.40, "valor_total": 6720.0, "desconto": 537.60, "desconto_percentual": 8.0},
            ]},
        {"id": 3, "numero": 3, "cliente_id": 6, "cliente_nome": "TechBuild", "vendedor_id": 1, "vendedor_nome": "Carlos Silva", "data": datetime(2024, 12, 1, 9, 0, tzinfo=timezone.utc), "valor_total": 22300.0, "status": "confirmado", "tipo_operacao_id": 50, "tipo_operacao": "PED VDA", "transportadora_id": 2, "pagamento": "30 dias",
            "itens": [
                {"sequencia": 1, "produto_id": 6, "produto_nome": "Tijolo Baiano 9x19x19", "quantidade": 15.0, "valor_unitario": 420.00, "valor_total": 6300.0, "desconto": 189.0, "desconto_percentual": 3.0},
                {"sequencia": 2, "produto_id": 14, "produto_nome": "Rebloco 14x19x29", "quantidade": 5000.0, "valor_unitario": 3.20, "valor_total": 16000.0, "desconto": 480.0, "desconto_percentual": 3.0},
            ]},
        {"id": 4, "numero": 4, "cliente_id": 3, "cliente_nome": "Vertice Inc", "vendedor_id": 3, "vendedor_nome": "Roberto Lima", "data": datetime(2024, 12, 3, 11, 0, tzinfo=timezone.utc), "valor_total": 6548.0, "status": "pendente", "tipo_operacao_id": 50, "tipo_operacao": "PED VDA", "transportadora_id": 1, "pagamento": "30/60 dias",
            "itens": [
                {"sequencia": 1, "produto_id": 12, "produto_nome": "Tinta Acrilica 18L", "quantidade": 20.0, "valor_unitario": 189.90, "valor_total": 3798.0, "desconto": 379.80, "desconto_percentual": 10.0},
                {"sequencia": 2, "produto_id": 13, "produto_nome": "Argamassa AC-I 20kg", "quantidade": 100.0, "valor_unitario": 27.50, "valor_total": 2750.0, "desconto": 275.0, "desconto_percentual": 10.0},
            ]},
        {"id": 5, "numero": 5, "cliente_id": 4, "cliente_nome": "Monteiro Obras", "vendedor_id": 2, "vendedor_nome": "Ana Costa", "data": datetime(2024, 11, 10, 16, 0, tzinfo=timezone.utc), "valor_total": 6450.0, "status": "entregue", "tipo_operacao_id": 50, "tipo_operacao": "PED VDA", "transportadora_id": 1, "pagamento": "A vista",
            "itens": [
                {"sequencia": 1, "produto_id": 10, "produto_nome": "Fio Eletrico 2,5mm", "quantidade": 30.0, "valor_unitario": 145.00, "valor_total": 4350.0, "desconto": 0.0, "desconto_percentual": 0.0},
                {"sequencia": 2, "produto_id": 11, "produto_nome": "Disjuntor 32A Bipolar", "quantidade": 50.0, "valor_unitario": 42.00, "valor_total": 2100.0, "desconto": 0.0, "desconto_percentual": 0.0},
            ]},
        {"id": 6, "numero": 6, "cliente_id": 7, "cliente_nome": "RC Construcoes", "vendedor_id": 1, "vendedor_nome": "Carlos Silva", "data": datetime(2024, 11, 20, 8, 0, tzinfo=timezone.utc), "valor_total": 19712.0, "status": "cancelado", "tipo_operacao_id": 50, "tipo_operacao": "PED VDA", "transportadora_id": 4, "pagamento": "30 dias",
            "itens": [
                {"sequencia": 1, "produto_id": 5, "produto_nome": "Telha Ceramica Colonial", "quantidade": 8000.0, "valor_unitario": 2.80, "valor_total": 22400.0, "desconto": 2688.0, "desconto_percentual": 12.0},
            ]},
    ]

    for pd in pedidos_data:
        itens = pd.pop("itens")
        pedido = Pedido(**pd)
        db.add(pedido)
        db.flush()
        for it in itens:
            pedido_item = PedidoItem(pedido_id=pedido.id, **it)
            db.add(pedido_item)

    regra = RegraNegocio(
        desconto_maximo=15.0,
        pedido_minimo=500.0,
        bloqueio_inadimplencia=True,
        comissao_padrao=5.0,
        prazo_maximo=90,
        validar_estoque=True,
        permitir_venda_sem_estoque=False,
        nf_automatica=True,
        aprovar_desconto_acima=10.0,
        pedido_minimo_representante=300.0,
        credito_automatico=False,
        multiplo_venda=True,
    )
    db.add(regra)

    carteira = [
        CarteiraCliente(vendedor_id=1, vendedor_nome="Carlos Silva", tipo_vendedor="R", cliente_id=1, cliente_nome="Horizonte"),
        CarteiraCliente(vendedor_id=1, vendedor_nome="Carlos Silva", tipo_vendedor="R", cliente_id=5, cliente_nome="Athenas"),
        CarteiraCliente(vendedor_id=1, vendedor_nome="Carlos Silva", tipo_vendedor="R", cliente_id=6, cliente_nome="TechBuild"),
        CarteiraCliente(vendedor_id=1, vendedor_nome="Carlos Silva", tipo_vendedor="R", cliente_id=7, cliente_nome="RC Construcoes"),
        CarteiraCliente(vendedor_id=2, vendedor_nome="Ana Costa", tipo_vendedor="R", cliente_id=2, cliente_nome="Pioneiros"),
        CarteiraCliente(vendedor_id=2, vendedor_nome="Ana Costa", tipo_vendedor="R", cliente_id=4, cliente_nome="Monteiro Obras"),
        CarteiraCliente(vendedor_id=3, vendedor_nome="Roberto Lima", tipo_vendedor="V", cliente_id=3, cliente_nome="Vertice Inc"),
        CarteiraCliente(vendedor_id=4, vendedor_nome="Fernanda Reis", tipo_vendedor="V", cliente_id=8, cliente_nome="Sustenta"),
        CarteiraCliente(vendedor_id=5, vendedor_nome="Paulo Mendes", tipo_vendedor="R", cliente_id=8, cliente_nome="Sustenta"),
    ]
    db.add_all(carteira)

    empresas = [
        Empresa(id=6, razao_social="LIDER FILIAL 07", cnpj="59400853000759", cidade="Maua", uf="SP", ativo=True),
        Empresa(id=7, razao_social="APOLO BRINQUEDO", cnpj="62524947000159", cidade="Sao Paulo", uf="SP", ativo=True),
        Empresa(id=9, razao_social="AGARRADINHO", cnpj="08219480000198", cidade="Conchal", uf="SP", ativo=True),
    ]
    db.add_all(empresas)
    db.flush()

    todos_vendedores = [1, 2, 3, 4, 5]
    for vid in todos_vendedores:
        for eid in [6, 7, 9]:
            db.add(VendedorEmpresa(vendedor_id=vid, empresa_id=eid))

    precos_seed = [
        PrecoProduto(codtab=45, empresa_id=6, produto_id=1, preco=32.90),
        PrecoProduto(codtab=45, empresa_id=6, produto_id=2, preco=38.50),
        PrecoProduto(codtab=45, empresa_id=6, produto_id=3, preco=28.90),
        PrecoProduto(codtab=45, empresa_id=6, produto_id=4, preco=22.40),
        PrecoProduto(codtab=45, empresa_id=6, produto_id=5, preco=2.80),
        PrecoProduto(codtab=45, empresa_id=6, produto_id=6, preco=420.00),
        PrecoProduto(codtab=45, empresa_id=6, produto_id=7, preco=85.00),
        PrecoProduto(codtab=45, empresa_id=6, produto_id=8, preco=72.00),
        PrecoProduto(codtab=45, empresa_id=6, produto_id=10, preco=145.00),
        PrecoProduto(codtab=45, empresa_id=6, produto_id=11, preco=42.00),
        PrecoProduto(codtab=45, empresa_id=6, produto_id=12, preco=189.90),
        PrecoProduto(codtab=45, empresa_id=6, produto_id=13, preco=27.50),
        PrecoProduto(codtab=45, empresa_id=6, produto_id=14, preco=3.20),
        PrecoProduto(codtab=45, empresa_id=6, produto_id=15, preco=95.00),
        PrecoProduto(codtab=47, empresa_id=7, produto_id=1, preco=35.90),
        PrecoProduto(codtab=47, empresa_id=7, produto_id=2, preco=41.50),
        PrecoProduto(codtab=47, empresa_id=7, produto_id=3, preco=31.90),
        PrecoProduto(codtab=47, empresa_id=7, produto_id=9, preco=18.50),
        PrecoProduto(codtab=47, empresa_id=7, produto_id=12, preco=199.90),
        PrecoProduto(codtab=47, empresa_id=7, produto_id=13, preco=29.50),
    ]
    db.add_all(precos_seed)

    # Seed initial business rules
    business_rules_seed = [
        BusinessRule(
            id="rule-1",
            name="Desconto Progressivo por Quantidade",
            description="Desconto escalonado baseado na quantidade total de itens no pedido",
            type="PROGRESSIVE",
            enabled=True,
            priority="HIGH",
            discount_type="PERCENTAGE",
            discount_value=0,
            progressive_tiers=[
                {"threshold": 100, "discountValue": 3},
                {"threshold": 500, "discountValue": 5},
                {"threshold": 1000, "discountValue": 8},
                {"threshold": 5000, "discountValue": 12},
            ],
            created_at=now,
            updated_at=now,
            applied_count=0,
        ),
        BusinessRule(
            id="rule-2",
            name="Desconto à Vista",
            description="5% de desconto para pagamentos à vista",
            type="CASH_DISCOUNT",
            enabled=True,
            priority="MEDIUM",
            discount_type="PERCENTAGE",
            discount_value=5,
            created_at=now,
            updated_at=now,
            applied_count=0,
        ),
        BusinessRule(
            id="rule-3",
            name="Frete Grátis acima de R$ 5.000",
            description="Frete grátis para pedidos acima de R$ 5.000,00",
            type="FREE_SHIPPING",
            enabled=True,
            priority="MEDIUM",
            discount_type="PERCENTAGE",
            discount_value=0,
            free_shipping_threshold=5000,
            created_at=now,
            updated_at=now,
            applied_count=0,
        ),
        BusinessRule(
            id="rule-4",
            name="Desconto Máximo Global",
            description="Limite o desconto total a 15% do valor do pedido",
            type="MAX_DISCOUNT",
            enabled=True,
            priority="CRITICAL",
            discount_type="PERCENTAGE",
            discount_value=15,
            created_at=now,
            updated_at=now,
            applied_count=0,
        ),
        BusinessRule(
            id="rule-5",
            name="Promoção Cimento",
            description="8% de desconto em todos os produtos da categoria Cimento",
            type="CATEGORY_PROMO",
            enabled=False,
            priority="LOW",
            discount_type="PERCENTAGE",
            discount_value=8,
            product_filter={"category": "Cimento"},
            created_at=now,
            updated_at=now,
            applied_count=0,
        ),
        BusinessRule(
            id="rule-6",
            name="Cliente VIP",
            description="3% de desconto adicional para clientes VIP",
            type="CUSTOMER_VIP",
            enabled=True,
            priority="MEDIUM",
            discount_type="PERCENTAGE",
            discount_value=3,
            customer_filter={"isVip": True},
            created_at=now,
            updated_at=now,
            applied_count=0,
        ),
    ]
    db.add_all(business_rules_seed)

    db.commit()
