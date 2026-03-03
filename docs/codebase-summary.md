# Cookmate Codebase Summary

## Repository Structure

```
cookmate/
├── apps/mobile/              React Native Expo app (pnpm workspace)
├── backend/                  Spring Boot REST API (Maven)
├── docker/                   Docker configuration files
├── .github/workflows/        CI/CD pipelines (GitHub Actions)
├── docs/                     Project documentation
├── plans/                    Implementation plans and reports
├── docker-compose.yml        Local development environment
├── package.json              Root pnpm workspace config
└── README.md                 Project overview
```

## Mobile App (apps/mobile/)

**Stack:** React Native Expo SDK 55, React 19.2.0, Expo Router v7, TypeScript

**Structure:**
```
apps/mobile/
├── app/                      Expo Router pages (file-based routing)
│   ├── _layout.tsx           Root layout
│   ├── index.tsx             Home screen
│   └── +not-found.tsx        404 page
├── app.json                  Expo configuration
├── tsconfig.json             TypeScript configuration
└── package.json              Mobile dependencies
```

**Key Entry Point:** `apps/mobile/app/_layout.tsx` — root layout with Router setup
**Routing:** File-based via Expo Router (`app/(tabs)/`, `app/auth/`, etc.)
**Styling:** React Native StyleSheet; no external CSS framework yet
**State Management:** TODO (Redux, Zustand, Context)

## Backend API (backend/)

**Stack:** Spring Boot 3.5.11, Java 21 LTS, Spring Data MongoDB, Lombok, Maven

**Architecture (Layered):**
```
com.cookmate/
├── CookmateApplication.java  Entry point
├── controller/               REST endpoints (@RestController)
├── service/                  Business logic (@Service)
├── repository/               Data access (@Repository, Spring Data)
├── model/                    MongoDB entities (@Document)
├── dto/                      Request/Response transfer objects
├── config/                   Spring beans, CORS, MongoDB
└── exception/                Error handling (@ControllerAdvice)
```

**Key Entry Point:** `backend/src/main/java/com/cookmate/CookmateApplication.java`
**Port:** 8080 (configurable via `server.port`)
**Profiles:** `dev` (local, MongoDB @ localhost:27017), `prod` (env vars)
**Database Driver:** MongoDB Java Driver via Spring Data MongoDB

## Database (MongoDB 8.0)

**Collections (planned):**
- `users` — User accounts, profiles, credentials
- `recipes` — Recipe documents, ingredients, steps
- `follows` — User follow relationships
- `likes` — Like/bookmark mappings
- `comments` — Comments on recipes
- `ratings` — Recipe ratings

**Connection:**
- Local: `mongodb://mongodb:27017/cookmate` (Docker)
- Production: `MONGODB_URI` environment variable

## Infrastructure

**Docker Services (docker-compose.yml):**
- `mongodb` — MongoDB 8.0 with persistent volume, health checks
- `api-server` — Spring Boot API (Dockerfile.backend multi-stage build)

**Network:** `cookmate-network` bridge for inter-container communication

**Dockerfile.backend:** Multi-stage build (Maven builder → lightweight runtime)

## CI/CD (GitHub Actions)

**Workflows:**
- `.github/workflows/frontend-ci.yml` — Run tests, lint, build mobile app
- `.github/workflows/backend-ci.yml` — Run Maven tests, checkstyle, build JAR

**Triggers:** On PR creation, push to main
**Status:** Basic pipeline; TODO add deployment steps

## Key Dependencies

**Frontend:**
- `expo` 55.x, `react-native` 0.83.2, `react` 19.2.0
- `expo-router` v7 (file-based routing)
- `@expo/vector-icons` (FontAwesome6, MaterialCommunityIcons)
- `typescript` 5.9.x, `eslint` 9.x, `prettier`

**Backend:**
- `spring-boot-starter-web` — REST framework
- `spring-boot-starter-data-mongodb` — MongoDB access
- `org.projectlombok:lombok` — Boilerplate reduction
- `spring-boot-starter-validation` — @Valid annotations
- `spring-boot-devtools` — Hot reload

## API Contracts

**Base URL:** `http://localhost:8080/api` (dev), `https://api.cookmate.com` (prod)

**Standard Endpoints (planned):**
- `POST /auth/register` — User registration
- `POST /auth/login` — Login, JWT token
- `GET /users/{id}` — User profile
- `GET /recipes` — List recipes (paginated)
- `POST /recipes` — Create recipe
- `GET /recipes/{id}` — Recipe detail

**Error Response Format:**
```json
{
  "error": "NOT_FOUND",
  "message": "Recipe with ID 123 not found",
  "timestamp": "2026-03-06T10:30:45Z"
}
```

## Development Workflow

1. **Clone & Setup:** `git clone`, `pnpm install`, `docker compose up`
2. **Mobile Dev:** `cd apps/mobile && pnpm start` (Expo Go or emulator)
3. **Backend Dev:** `cd backend && ./mvnw spring-boot:run` (dev profile)
4. **API Testing:** Use Postman, curl, or REST Client
5. **Git:** Create feature branches, make PR, ensure CI passes

## Standards References

See [Code Standards](code-standards.md), [System Architecture](system-architecture.md), and [Design Guidelines](design-guidelines.md) for detailed conventions.
