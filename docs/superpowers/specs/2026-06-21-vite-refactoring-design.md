# Design Spec: Refactoring ForceVendas PRO Frontend to Vite SPA

- **Date:** 2026-06-21
- **Status:** Approved
- **Target Directory:** `/home/lider/project/aplicacoes/forcadevendas/refactory`
- **Source Directory:** `/home/lider/project/aplicacoes/forcadevendas/salesglm`

---

## 1. Objective

Refactor the frontend of the "ForceVendas PRO" system from Next.js (v16.1.1) to a lightweight client-side Single Page Application (SPA) powered by **Vite (React + TypeScript + Tailwind CSS v4)**.

All existing UI design and business rules must be preserved. We will introduce **Vitest** to validate logic parity (TDD) for critical modules like the local business rules engine.

**Final Success Criteria:** The refactored Vite application must successfully emit a complete sales order (pedido) containing all necessary data, with all local business rules and validations fully applied and verified.

---

## 2. Architecture & File Mapping

We will structure the new workspace as a standard Vite React project. The folder hierarchy maps from `salesglm` to `refactory` as follows:

| Source (Next.js) | Destination (Vite SPA) | Notes |
| :--- | :--- | :--- |
| `src/app/page.tsx` | `src/App.tsx` | Main entry view. Remove `'use client'`. Wrap inside `EmpresaProvider` and `Toaster`. |
| `src/app/layout.tsx` | `index.html` / `src/main.tsx` | HTML template, fonts, and React bootstrap mount. |
| `src/app/globals.css` | `src/index.css` | Tailwind CSS imports and theme configuration. |
| `src/components/` | `src/components/` | Copy component files directly. |
| `src/contexts/` | `src/contexts/` | Copy React Context providers. |
| `src/hooks/` | `src/hooks/` | Copy custom React Hooks. |
| `src/lib/` | `src/lib/` | Copy API clients, schemas, and rule engines. |
| `src/store/` | `src/store/` | Copy Zustand store definitions. |

---

## 3. Technology Stack & Configuration

### Build Tools & Core Libraries
* **Framework:** React v19.0.0
* **Bundler:** Vite (using `@tailwindcss/vite` and `vite-tsconfig-paths` for path alias resolution `@/*`)
* **Styling:** Tailwind CSS v4.0.0 (using `@import "tailwindcss"` and `@theme` configuration directives)
* **Icons:** `lucide-react`
* **State Management:** Zustand v5.0.6 & React Context

### Testing Infrastructure (TDD)
* **Framework:** Vitest & `@testing-library/react`
* **Execution:** Run via `npm run test` or `bun test`

---

## 4. Testing & Parity Strategy

To ensure zero regression, the refactoring process will follow a strict validation strategy:
1. **Rule Engine Coverage:** Write tests in `src/__tests__/business-rules.test.ts` mapping the original behaviors of the discount/pricing logic from `src/lib/business-rules/engine.ts`.
2. **Store Validation:** Write unit tests for `useCartStore` to ensure items are added, updated, and validated identically.
3. **API Client & Sync Validation:** Write tests in `src/__tests__/erp-api.test.ts` to mock and validate the ERP API clients, authentication responses, data fetching, and local data synchronization states (`src/lib/erp-api.ts`).
4. **Execution Parity:** Run Vitest tests to confirm complete behavioral equivalence before finalizing.
