# FWVendas — ERP Vendas V-PRO

Fullstack monorepo para gestão de vendas com integração Sankhya ERP.

## Stack

| Camada | Tecnologia |
|--------|------------|
| **Backend** | FastAPI 0.115 + SQLAlchemy 2.0 + Pydantic V2 (Python 3.12) |
| **Frontend** | React 19 + Vite + Tailwind CSS + shadcn/ui |
| **Proxy** | nginx (reverse proxy, sem CORS) |
| **Banco** | PostgreSQL 16 (prod) / SQLite (dev) |
| **Infra** | Docker Compose + Coolify |

## Estrutura

```
refactory/
├── backend/          # FastAPI (app/, models/, services/, api/)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/         # React + Vite (src/components/, lib/, store/)
│   ├── Dockerfile
│   └── package.json
├── nginx/
│   └── nginx.conf    # Reverse proxy /api/ → backend:8000
├── docker-compose.yml
└── .env              # VELOFLOW_API_URL + token
```

## Como rodar

```bash
# Clone e entre
git clone git@github.com:liderbrinquedos/fwvendas.git
cd fwvendas

# Configure .env
cp .env.example .env
# Edite VELOFLOW_API_URL e token conforme necessário

# Suba tudo
docker compose up -d --build

# Acesse
# Frontend: http://localhost:3005
# API:      http://localhost:3005/api/v1/
# Docs:     http://localhost:3005/docs
```

## Login

- **Admin:** `admin` / `admin123`
- **Vendedor:** ID do vendedor (ex: `1`) / `1234`

## Funcionalidades

- Dashboard com vendas, pedidos e estoque em tempo real
- Grade de produtos com **toggle de colunas** e busca por referência/nome
- Clientes com **paginação client-side** (top 16 + busca ilimitada)
- Sync completo de 12 módulos da API VeloFlow ERP
- Preços reais via LEFT JOIN em `precos_produto`
- Pedidos com filtro por período (últimos 6 meses)

## Sincronização

```bash
# Sincronizar módulo específico
curl -X POST http://localhost:3005/api/v1/sync/pedidos?meses=6

# Sincronizar todos os módulos
curl -X POST http://localhost:3005/api/v1/sync/all

# Ver status da sincronização
curl http://localhost:3005/api/v1/sync/status
```

## Licença

Proprietária — Lider Brinquedos
