# Spec: Refatoração salesglm/ → Vite

**Data:** 2026-06-21
**Status:** Aprovado
**Escopo:** Migração completa do frontend Next.js para Vite

---

## 1. Contexto

O projeto `salesglm/` é um frontend Next.js 16 que consome uma API FastAPI backend (`erp-vendas-vpro`). O objetivo é migrar para Vite + React SPA para:
- Eliminar dependências Next.js (App Router, next/font, next-auth unused)
- Simplificar o build (SPA vs SSR desnecessário)
- Manter o mesmo backend FastAPI inalterado

## 2. Stack Atual vs Target

| Item | salesglm (atual) | refactory (target) |
|------|------------------|-------------------|
| Framework | Next.js 16 | Vite 6 + React 19 |
| Routing | App Router (state) | React Router 7 |
| Fonts | next/font/google | Google Fonts link |
| Env vars | NEXT_PUBLIC_* | VITE_* |
| Build | next build | vite build |
| Testing | none | Vitest + RTL |
| ORM | Prisma (unused) | Removido |
| Auth | next-auth (unused) | Removido |

## 3. Estrutura de Diretórios

```
salesglm/
├── src/
│   ├── main.tsx                    # Entry point React
│   ├── App.tsx                     # Router provider
│   ├── index.css                   # Tailwind imports
│   ├── routes.tsx                  # Definição de rotas
│   ├── components/
│   │   ├── ui/                     # shadcn/ui (manter)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── cart-sheet.tsx
│   │   ├── clientes.tsx
│   │   ├── dashboard.tsx
│   │   ├── erp.tsx
│   │   ├── pedidos.tsx
│   │   ├── produtos.tsx
│   │   ├── regras.tsx
│   │   └── transportadoras.tsx
│   ├── contexts/
│   │   └── empresa-context.tsx
│   ├── hooks/
│   │   └── (custom hooks)
│   ├── lib/
│   │   ├── api.ts                 # erp-api.ts adaptado
│   │   ├── types.ts               # types-erp.ts
│   │   ├── utils.ts
│   │   └── business-rules/
│   ├── store/
│   │   ├── app-store.ts
│   │   └── cart-store.ts
│   └── setupTests.ts
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.ts
```

## 4. Mudanças por Componente

### 4.1 Configuração
- `vite.config.ts`: Configurar plugins (react, tailwindcss, tsconfigPaths)
- `tsconfig.json`: Adicionar paths `@/*` → `./src/*`
- `index.html`: Mover fonts Google Fonts para `<link>`, body classes
- `package.json`: Atualizar scripts (dev, build, test)

### 4.2 Entry Point
- `main.tsx`: ReactDOM.createRoot, import App e index.css
- `App.tsx`: BrowserRouter + Routes + EmpresaProvider

### 4.3 Rotas
- Criar `routes.tsx` com React Router
- Mapear páginas: /, /pedidos, /produtos, /clientes, /transportadoras, /regras, /erp
- Layout com Sidebar + Header

### 4.4 Contexts
- `empresa-context.tsx`: Remover `'use client'`, manter lógica

### 4.5 Lib
- `api.ts`: `process.env.NEXT_PUBLIC_*` → `import.meta.env.VITE_*`
- `types.ts`: Sem mudança
- `utils.ts`: Sem mudança

### 4.6 Stores
- `app-store.ts`: Sem mudança (Zustand independente)
- `cart-store.ts`: Sem mudança (Zustand independente)

### 4.7 Componentes
- Todos: Remover `'use client'`
- `page.tsx` → Separar em componentes por rota
- Manter shadcn/ui como está

## 5. Dependências

### Remover
```diff
- next
- next-auth
- next-intl
- next-themes
- @prisma/client
- prisma
- eslint-config-next
- eslint
```

### Adicionar
```diff
+ react-router-dom
+ vite-tsconfig-paths
+ @vitejs/plugin-react
+ @tailwindcss/vite
+ vitest
+ @testing-library/react
+ @testing-library/jest-dom
+ jsdom
```

## 6. Ordem de Implementação

1. **Fase 1: Configuração**
   - Criar package.json com dependências
   - Configurar vite.config.ts
   - Configurar tsconfig.json
   - Criar index.html com fonts

2. **Fase 2: Infraestrutura**
   - Copiar/adaptar lib/api.ts
   - Copiar lib/types.ts
   - Copiar lib/utils.ts
   - Copiar lib/business-rules/
   - Copiar store/app-store.ts
   - Copiar store/cart-store.ts
   - Copiar contexts/empresa-context.tsx

3. **Fase 3: Layout**
   - Criar main.tsx
   - Criar App.tsx com Router
   - Criar routes.tsx
   - Mover Sidebar para components/layout/
   - Mover Header (extraído de page.tsx) para components/layout/

4. **Fase 4: Componentes**
   - Copiar/adaptar cada componente
   - Dashboard, Pedidos, Produtos, Clientes, Transportadoras, Regras, ERP
   - CartSheet

5. **Fase 5: Testes**
   - Configurar setupTests.ts
   - Criar testes unitários para stores
   - Criar testes de componente básicos

6. **Fase 6: Deploy**
   - Atualizar Dockerfile
   - Atualizar docker-compose.yml

## 7. Pontos de Atenção

- **Env vars:** Todas `NEXT_PUBLIC_*` devem virar `VITE_*`
- **Fonts:** Usar `<link>` em index.html ao invés de next/font
- **Rotas:** state-based → React Router URLs reais
- **SSR:** Remover任何 referência a server-side rendering
- **Prisma:** Não existe uso no frontend, remover completamente

## 8. Critérios de Aceite

- [ ] App roda com `npm run dev` (Vite)
- [ ] Build produz `dist/` funcionando
- [ ] Login flux funciona
- [ ] Seleção de empresa funciona
- [ ] Todas as páginas acessíveis via rotas
- [ ] Carrinho funciona (add/remove/update)
- [ ] Integração com backend FastAPI funciona
- [ ] Testes passam com `npm test`
- [ ] Docker build funciona

---

**Próximo passo:** Implementação seguindo a ordem acima.
