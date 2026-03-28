# Copilot Instructions — Inventory Frontend

## Project Overview

React 18 + TypeScript 4.9.5 frontend for a D&D-style inventory management app with a fantasy calendar (Pyarr) and gold/silver/copper currency system. Built with Create React App (`react-scripts` 5.0.1), served via nginx in Docker.

## Build & Run

```bash
npm install          # install dependencies
npm start            # dev server on :3000, proxies /api → :8080
npm run build        # production bundle to build/
npx tsc --noEmit     # type-check without emitting
```

Docker (from repo root):
```bash
docker compose up -d            # start all services
docker compose build frontend   # rebuild frontend only
docker compose up --build       # rebuild + restart all
```

## Architecture

```
src/
├── components/        # Shared UI (LanguageToggle, Notification)
├── i18n/              # Custom i18n: LanguageContext + translations (en/hu)
├── pages/             # Route-level pages (flat files for simple, subfolder for complex)
│   └── inventory/     # Subfolder pattern: orchestrator + sub-components + types + barrel index
├── services/api.ts    # Single axios instance, service objects (auth, character, inventory, category, template)
├── types/index.ts     # All global TypeScript interfaces
└── utils/             # Domain utilities (currency, calendar, error handling)
```

### Key Patterns

- **State**: `useState`/`useEffect` per page. One context: `LanguageContext` for i18n. No Redux.
- **Auth**: JWT token in `localStorage`. Axios interceptor attaches Bearer header. 401 → hard redirect to `/login`.
- **Routing**: `react-router-dom` v6. `PrivateRoute` checks `localStorage('token')`.
- **API layer**: All API calls go through typed service objects in `services/api.ts`. Use `getApiErrorMessage(err, fallback)` and `isApiStatus(err, status)` from `utils/errorUtils.ts` for error handling.
- **Types**: Global interfaces in `types/index.ts`. Page-local types in the page's subfolder (e.g., `pages/inventory/types.ts`).
- **Complex pages**: Use a subfolder with barrel `index.ts` re-export (see `pages/inventory/`). Simple pages are flat files.
- **i18n**: All user-visible strings go through `t` from `useLanguage()`. Both `en` and `hu` keys must be added for new strings.

## Domain Logic

- **Pyarr Calendar**: 31 months × 20 days = 620 days/year. Months are grouped by gods (Kyel, Darton, Uwel, Albourne, Adron, Krad, Dreina, Antoh, Arel) and 3 seasons. Defined in `utils/dateFormatting.ts`. Must stay in sync with backend's `calendar_configuration` SQL.
- **Currency**: 1 gold = 100 silver = 10,000 copper. Stored as copper internally. Utilities in `utils/currencyUtils.ts`.
- **Containers**: Inventory items with category "container" can hold other items. Supports nested containers.

## Critical Constraints

| Constraint | Detail |
|---|---|
| **Node.js ≤ 18** | `react-scripts` 5.0.1 breaks on Node 19+. Dockerfile uses `node:18`. |
| **TypeScript 4.x** | Pinned to `^4.9.5` by `react-scripts` peer dep. Cannot use TS 5.x features. |
| **Partial strict mode** | `strict: false` + `strictNullChecks: true`. Do NOT enable `strict: true` without auditing all files. |
| **No ejecting** | Stay within CRA constraints. No custom webpack config. |

## Code Style

- Use `err: unknown` (never `err: any`) in catch blocks. Use `getApiErrorMessage()` / `isApiStatus()` for type-safe error handling.
- All API functions must have explicit return types.
- Parse `useParams()` values to numbers once at the top of the component; redirect if `NaN`.
- Avoid inline styles. Use CSS Modules (`*.module.css`) for component-scoped styles or global utility classes from `styles.css`.
- No unnecessary abstractions — keep it simple.
