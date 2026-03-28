# CLAUDE.md — Inventory Management System

## Project Overview
Full-stack fantasy inventory management app (think RPG character inventory). Users register, create characters, and manage each character's item inventory.

## Tech Stack
- **Frontend**: TypeScript, React 18, React Router, Axios — lives in `frontend/`
- **Backend**: Java 17, Spring Boot 3.2, Spring Security (JWT), Spring Data JPA — lives in `backend/`
- **Database**: PostgreSQL 15
- **Infrastructure**: Docker + Docker Compose, Nginx (frontend serving)

## Running the App

### Full stack (Docker)
```bash
docker compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

### Local development
```bash
# Backend
cd backend && mvn spring-boot:run

# Frontend
cd frontend && npm install && npm start
```

### Verify builds
```bash
cd backend && mvn clean compile
cd frontend && npx tsc --noEmit
```

## Architecture

### Backend (`backend/src/main/java/com/inventory/`)
```
config/       - Security config (SecurityConfig.java)
controller/   - REST endpoints (Auth, Character, Inventory, Category, Template)
dto/          - Request/Response objects
entity/       - JPA entities (User, Character, Inventory, Category, ItemTemplate, TemplateContent, CalendarMonth, InventoryHistory)
repository/   - Spring Data JPA repositories
security/     - JWT filter + JwtUtil + CustomUserDetailsService
service/      - Business logic
exception/    - GlobalExceptionHandler + custom exceptions
util/         - CurrencyUtil, ValidationUtil
```

### Frontend (`frontend/src/`)
```
pages/           - Top-level pages (Login, Register, Characters, Categories, TemplatesPage, TemplateFormPage)
pages/inventory/ - Inventory sub-components (InventoryPage, InventoryTable, InventoryForm, InventoryFilters, ColumnSettings, CloneDialog)
services/api.ts  - Axios API client
types/index.ts   - TypeScript interfaces
i18n/            - Translations + LanguageContext (multilingual support)
utils/           - currencyUtils, dateFormatting, errorUtils
components/      - Shared components (Notification, LanguageToggle)
```

## Key Domain Concepts
- **Currency**: Stored as `priceInCopper` (Long). Fantasy currency: gold/silver/copper with auto-normalization (`CurrencyUtil`).
- **Soft delete**: Inventory items are never hard-deleted — `removed=true` + `removedText` reason stored; hidden from UI.
- **Containers**: Items with category "container" can hold other items. Weight auto-calculated (container + contents).
- **Templates**: Item templates (`ItemTemplate` + `TemplateContent`) allow pre-filling inventory items.
- **Inventory filtering**: By category (exact), min price (copper), max weight (kg per item).

## API Endpoints
- `POST /api/auth/register` / `POST /api/auth/login` / `DELETE /api/auth/account`
- `GET|POST /api/characters` / `DELETE /api/characters/{id}`
- `GET|POST /api/characters/{characterId}/inventory`
- `PUT|DELETE /api/characters/{characterId}/inventory/{inventoryId}`
- `GET|POST|PUT|DELETE /api/categories`
- `GET|POST|PUT|DELETE /api/templates`

## Conventions
- No admin roles — all users have equal access to their own data only
- JWT stateless auth; CSRF intentionally disabled
- Frontend uses **CSS Modules** for component-scoped styles (`*.module.css`) + a global `styles.css` for shared utilities, buttons, layout helpers, and auth styles. Avoid inline styles — use module classes or globals.
- TypeScript strict typing — avoid `any`
- Backend follows standard Spring layered architecture: controller → service → repository

## Engineering Principles

These apply to all code written in this project — frontend and backend alike.

### General
- **Clean, readable code over clever code.** Names (variables, methods, classes) must clearly express intent. No abbreviations unless universally understood.
- **YAGNI + Open/Closed together** — don't implement features that aren't needed yet, but do introduce the right abstractions and extension points so that adding them later doesn't require rewriting existing code. The goal is a codebase that is closed for modification but open for extension — not a minimal one that will need surgery every time it grows.
- **Separation of concerns** — each class, component, and function should have one clear responsibility. UI components don't contain business logic; services don't format responses for the view.

### SOLID (applied pragmatically)
- **Single Responsibility**: one reason to change per class/component. Split when a unit starts doing two distinct things.
- **Open/Closed**: prefer extending behaviour by adding new classes/components rather than modifying existing ones. Use interfaces and abstractions at boundaries that are likely to change (e.g. service interfaces in the backend).
- **Liskov Substitution**: subtypes must honour the contract of their parent — don't override in ways that surprise callers.
- **Interface Segregation**: keep interfaces focused; don't force implementors to depend on methods they don't use.
- **Dependency Inversion**: depend on abstractions, not concretions — especially in the backend service layer.

### Backend (Java / Spring Boot)
- Use `private` by default; widen access only when necessary and intentional.
- Services depend on repository interfaces, not implementations.
- DTOs (`*Request` / `*Response`) form the controller↔service boundary — controllers never touch entities, and entities never leave the service as return values. Internally, the service layer works directly with JPA entities; there is no separate domain model between service and repository.
- Custom exceptions (`ResourceNotFoundException`, `InvalidOperationException`, etc.) are preferred over generic `RuntimeException`.
- Validation belongs in the service layer (or request DTOs), not in controllers or entities.

### Frontend (TypeScript / React)
- Components are purely presentational where possible; data fetching and state live in page-level components or custom hooks.
- No `any` — use proper TypeScript types; extend `types/index.ts` when new shapes are needed.
- Prefer small, focused components. If a component is doing layout, data transformation, and rendering, split it.
- Design patterns to apply where they fit: **Strategy** for swappable behaviour (e.g. different filter strategies), **Observer/Context** for shared state (already used in `LanguageContext`), **Factory** for constructing complex objects.
