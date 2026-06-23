# Implementation Plan: Refactoring ForceVendas PRO Frontend to Vite SPA

This document outlines the step-by-step implementation plan to refactor the frontend from Next.js to Vite SPA in `/home/lider/project/aplicacoes/forcadevendas/refactory`.

---

## Phase 1: Base Project Initialization

### Step 1.1: Setup Project Files & Compatibility Shim
Initialize the core project files in `/home/lider/project/aplicacoes/forcadevendas/refactory`:
- `package.json` (Clean dependencies: Vite, React 19, Tailwind v4, Zustand, Vitest, Lucide; omit `@prisma/client`, `prisma`, and `eslint-config-next`)
- `tsconfig.json` (TypeScript options & `@/*` path mapping)
- `vite.config.ts` (React, Tailwind plugin, TypeScript paths plugin, Vitest configuration. Add **environment variable shim** for `process.env.NEXT_PUBLIC_BACKEND_URL` mapped to `import.meta.env.VITE_BACKEND_URL` / `http://localhost:8000`)
- `index.html` (Google Fonts Space Grotesk & DM Sans, root mount node)
- `src/main.tsx` (React bootstrap mount)

---

## Phase 2: Core Logic Migration & TDD Validation

### Step 2.1: Copy & Clean Libraries
- Copy `src/lib/` folder from `salesglm` to `refactory`.
- Delete the unused `src/lib/db.ts` (Prisma initializer) to clean up frontend code.
- Install node dependencies.

### Step 2.2: Implement TDD for Business Rules
- Create `/refactory/src/__tests__/business-rules.test.ts`.
- Write unit tests testing all discount validation, payment term calculations, and rule conditions.
- Run `vitest` to verify all test cases pass.

### Step 2.3: Implement TDD for API Client & Sync (with Mocks)
- Create `/refactory/src/__tests__/erp-api.test.ts`.
- Write unit tests using API mocks (`msw` or `vitest` fetch mocks) to verify connection, authentication flow, and data synchronizations.
- Run `vitest` to verify all mock tests pass.

### Step 2.4: Real File/Payload Validation (End-to-End Logic Validation)
- Write tests using actual/real JSON payloads (representing products, rules, and synchronization records exported from the real database/backend).
- Validate that the data mapper (`src/lib/types-erp.ts`) and rule validator process these real payloads correctly.
- Run `vitest` to verify.

---

## Phase 3: State & UI Migration

### Step 3.1: Copy State Stores and Contexts
- Copy `src/store/` (Zustand stores) and `src/contexts/` to `refactory`.
- Adapt store initializations if needed (e.g. storage persistence).

### Step 3.2: Copy Components & Setup Styling
- Copy `src/components/` and `src/hooks/` to `refactory`.
- Configure `src/index.css` with `@import "tailwindcss"` and theme variables.

### Step 3.3: Port Main App Entrance
- Port `src/app/page.tsx` (Next.js entry) to `src/App.tsx` (Vite entry).
- Wrap inside `EmpresaProvider` and custom `Toaster` component in `src/main.tsx` or `src/App.tsx`.

---

## Phase 4: Verification & Order Emission Validation

### Step 4.1: Build & TypeScript Compilation
- Run `npm run build` or `bun run build` to verify there are zero build or type compilation errors.

### Step 4.2: Integration Test with Real Backend
- Run `npm run dev` or `bun run dev` alongside the running Python FastAPI backend.
- Authenticate a real user, trigger a data synchronization, build a cart, and emit a complete sales order.
- Verify that the emitted order contains all correct data payload structures and satisfies the local and backend rules.
