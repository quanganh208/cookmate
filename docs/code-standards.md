# Cookmate — Code Standards

## General

- Keep files under 200 lines; split when exceeding
- Write self-documenting code with meaningful names
- Add comments only for non-obvious logic

## TypeScript / React Native

### Naming

- **Files:** kebab-case (`recipe-card.tsx`, `use-auth.ts`)
- **Directories:** kebab-case (`app/`, `components/`, `hooks/`, `services/`, `types/`)
- **Components:** PascalCase (`RecipeCard`, `HomeScreen`)
- **Functions/variables:** camelCase (`getRecipes`, `isLoading`)
- **Constants:** UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces:** PascalCase (`Recipe`, `UserProfile`)

### Structure (Feature-Based with Expo Router v7)

**Routes (app/ directory):** Thin 2-line wrappers that import and re-export feature screens. No business logic in route files.

**Feature Modules (features/ directory):** Self-contained features with their own:

- `components/` — Feature-specific UI components
- `screens/` — Screen components exported to app/
- `api/` — Repository pattern (HTTP calls + caching)
- `hooks/` — Custom hooks (queries, state subscriptions)
- `store.ts` — Zustand state (UI state only: filters, selections, toggles)
- `types.ts` — Feature-specific TypeScript interfaces
- `index.ts` — Barrel export for clean imports

**Shared Utilities (shared/ directory):**

- `components/` — Cross-feature reusable UI (AnimatedPressable, CategoryChips, RecipeCards)
- `api/` — HTTP client, QueryClientProvider, MMKV storage
- `constants/` — Colors, fonts, mock data
- `types/` — Global type re-exports
- `hooks/` — (future) Auth, navigation utilities

**State Management:**

- **UI state** → Zustand stores (filters, visible modals, selected items)
- **Server state** → TanStack React Query (async data, caching, offline sync)
- **Local storage** → MMKV (offline recipe caching)

### Feature Module Conventions

- **Isolation:** Each feature is independent; import shared utilities via `@/shared/*` and other features via relative paths only when necessary
- **Naming:** Feature folder = kebab-case (e.g., `create-recipe`), screen files end with `-screen.tsx`, component files describe their purpose
- **Exports:** Each feature has `index.ts` barrel export; route files import via barrel (`import { HomeScreen } from '@/features/home'`)
- **API Layer:** Implement repository pattern (e.g., `recipes-repository.ts`) for HTTP abstraction; wrap with TanStack Query hooks
- **State:** UI state in Zustand (local, reset on unmount); server state in TanStack Query (persisted, synced offline)
- **No circular imports:** Features must not import from each other; share code via `shared/`

### Conventions

- Functional components only (no class components)
- Use TypeScript strict mode (`tsconfig.json`)
- Prefer `const` over `let`
- Use named exports for components
- Expo Router for file-based navigation; routes are thin wrappers

## Java / Spring Boot (4.0.3, Java 21)

### Naming

- **Files/Classes:** PascalCase (`RecipeService.java`)
- **Methods/variables:** camelCase (`findByAuthor`, `recipeCount`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_PAGE_SIZE`)
- **Packages:** lowercase with dots (`com.cookmate.controller`)

### Structure

```
com.cookmate/
├── controller/       # @RestController — HTTP endpoints
├── service/          # @Service — business logic
├── repository/       # @Repository — Spring Data MongoDB
├── model/            # @Document — MongoDB entities
├── dto/              # Request/Response DTOs
├── config/           # @Configuration — Spring beans
└── exception/        # @ControllerAdvice — error handlers
```

### Conventions

- Use Lombok for boilerplate (`@Data`, `@Builder`, `@AllArgsConstructor`)
- Use `@Valid` for request validation (spring-boot-starter-validation)
- Return `ResponseEntity<>` from controllers
- Use Spring profiles (`dev`, `prod`) for environment-specific config
- Enable Spring Data MongoDB with `spring-boot-starter-data-mongodb`

## Build Tools & Package Management

### Frontend (React Native)

- **Package Manager:** pnpm 10.7.0 (root workspace)
- **Monorepo:** pnpm workspaces
- **Mobile Build:** Maven wrapper in backend; npm/pnpm in frontend

### Backend (Spring Boot)

- **Build Tool:** Maven 3.9.x (wrapper: `./mvnw`)
- **Commands:**
  - `./mvnw clean install` — compile and test
  - `./mvnw spring-boot:run` — run locally with dev profile
  - `./mvnw package` — create JAR for Docker

## Development Environment

- **Local Database:** Docker Compose (MongoDB 8.0)
- **API Server:** Spring Boot dev profile (hot reload via devtools)
- **Mobile:** Expo start (fast refresh enabled)
- **Network:** All containers on `cookmate-network` bridge

## Git

### Workflow

- Always pull latest `main` before creating a feature branch
- Keep branches short-lived; merge via PR after CI passes
- Delete merged branches

### Branches

- `main` — production-ready code
- `feat/*` — feature branches
- `fix/*` — bug fix branches

### Commits

Follow Conventional Commits:

```
feat(recipes): add search by ingredient
fix(auth): resolve token refresh race condition
chore(deps): update Spring Boot to 4.0.3
```

## API Design

- RESTful endpoints under `/api/`
- Use plural nouns: `/api/recipes`, `/api/users`
- HTTP status codes: 200 (OK), 201 (Created), 400 (Bad Request), 404 (Not Found), 500 (Server Error)
- Consistent error response format:

```json
{
  "error": "NOT_FOUND",
  "message": "Recipe not found",
  "timestamp": "2026-03-06T09:00:00Z"
}
```
