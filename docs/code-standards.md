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

### Structure (Expo SDK 52 + Expo Router 4.0)
- **Pages** in `app/` — Expo Router file-based routing
- **Components** in `components/` — Reusable UI components
- **Hooks** in `hooks/` — Custom React hooks
- **Services** in `services/` — API calls and business logic
- **Types** in `types/` — TypeScript interfaces and types
- **Assets** in `assets/` — Images, fonts, static files

### Conventions
- Functional components only (no class components)
- Use TypeScript strict mode (`tsconfig.json`)
- Prefer `const` over `let`
- Use named exports for components
- Expo Router for navigation (no React Navigation setup yet)

## Java / Spring Boot (3.4.3, Java 21)

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

- **Local Database:** Docker Compose (MongoDB 7.0)
- **API Server:** Spring Boot dev profile (hot reload via devtools)
- **Mobile:** Expo start (fast refresh enabled)
- **Network:** All containers on `cookmate-network` bridge

## Git



### Branches
- `main` — production-ready code
- `feat/*` — feature branches
- `fix/*` — bug fix branches

### Commits
Follow Conventional Commits:
```
feat(recipes): add search by ingredient
fix(auth): resolve token refresh race condition
chore(deps): update Spring Boot to 3.4.4
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
