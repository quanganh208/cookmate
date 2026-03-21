# Cookmate — System Architecture

## Overview

Cookmate uses a monorepo with two main applications:
- **Mobile**: React Native Expo (SDK 55) with feature-based modular architecture, TanStack Query for offline-first caching, Zustand for UI state
- **Backend**: Spring Boot 4.0.3 REST API (Java 21) with Spring Data MongoDB
- **Database**: MongoDB 8.0 (containerized)

## Architecture Diagram

```
┌──────────────────┐       HTTP/REST       ┌──────────────────┐
│                  │  ──────────────────>   │                  │
│  Expo Mobile App │                        │  Spring Boot API │
│  (React Native)  │  <──────────────────   │  (Java 21)       │
│                  │       JSON             │                  │
└──────────────────┘                        └────────┬─────────┘
                                                     │
                                                     │ MongoDB Driver
                                                     │
                                            ┌────────▼─────────┐
                                            │                  │
                                            │    MongoDB 8.0   │
                                            │                  │
                                            └──────────────────┘
```

## Mobile Architecture (Feature-Based)

**Design Pattern:** Feature modules + shared utilities with clear separation of concerns.

```
Features (self-contained)
├── Home           → HomeScreen + header/carousel/trending components
├── Recipes        → RecipeDetailScreen + repository, hooks, store, types
├── Search         → SearchScreen + search logic
├── Favorites      → FavoritesScreen + bookmark management
├── CreateRecipe   → CreateRecipeScreen + form logic
└── Profile        → ProfileScreen + user data

Shared (cross-feature)
├── Components     → AnimatedPressable, CategoryChips, RecipeCards
├── API            → HTTP client, QueryClientProvider, MMKV storage
├── Constants      → Colors, fonts, mock data
└── Types          → Global type re-exports
```

**State Management:**
- **UI State (Zustand):** Filters, selections, visible modals, UI toggles. Local to feature/component. No persistence.
- **Server State (TanStack Query):** Recipes, user data, async operations. Cached via MMKV + sync persister. Persists across sessions.
- **Offline Support:** MMKV + TanStack Query sync persister enables recipe browsing without internet; cache syncs when connection restored.

**API Layer (Repository Pattern):**
```
RecipesRepository (recipes/api/)
├── list(params)     → GET /recipes (cached via useRecipes hook)
├── getById(id)      → GET /recipes/{id}
└── create(data)     → POST /recipes
```
Each repository method returns Promise; TanStack Query wraps with caching, retries, offline support.

**Route Layer (Thin Wrappers):**
```
app/(tabs)/index.tsx         → import { HomeScreen } from '@/features/home'; export default HomeScreen;
app/recipe/[id].tsx          → import { RecipeDetailScreen } from '@/features/recipes'; export default RecipeDetailScreen;
```
No business logic in route files; routes delegate entirely to feature screens.

## Monorepo Layout

```
cookmate/
├── apps/
│   └── mobile/              → React Native Expo (pnpm workspace)
│       ├── app/             → Expo Router pages (file-based routing)
│       ├── package.json      → Mobile app dependencies
│       └── tsconfig.json     → TypeScript config
├── backend/                 → Spring Boot API (Maven)
│   ├── src/main/java/com/cookmate/  → Application code
│   └── pom.xml              → Maven configuration
├── docker/                  → Docker configs
│   ├── Dockerfile.backend   → Backend container build
│   └── mongo-init.js        → MongoDB initialization
├── .github/
│   └── workflows/           → CI/CD workflows (frontend-ci.yml, backend-ci.yml)
├── package.json             → Root workspace (pnpm 10.7.0)
├── docker-compose.yml       → Local dev environment
└── README.md                → Project documentation
```

## Backend Architecture (Layered)

```
Controller → Service → Repository → MongoDB
     ↓           ↓
    DTO        Model
```

**Current Status:** Foundation scaffolded. Only `HealthController` (`GET /api/health`) and configs (CORS, MongoDB auditing, OpenAPI) are implemented. Service, Repository, Model, DTO, and Exception layers are directory placeholders pending Phase 3 (Authentication).

- **Controller** — REST endpoints, request validation (`HealthController` implemented)
- **Service** — Business logic, orchestration (pending Phase 3)
- **Repository** — Data access via Spring Data MongoDB (pending Phase 3)
- **Model** — Domain entities with MongoDB annotations (pending Phase 3)
- **DTO** — Request/response data transfer objects (pending Phase 3)
- **Config** — CORS, MongoDB auditing, OpenAPI (implemented)
- **Exception** — Custom exception handlers (pending Phase 3)

## Data Flow

1. Mobile app sends HTTP request to `/api/*`
2. CorsConfig allows cross-origin from dev ports
3. Controller validates input, delegates to Service
4. Service executes business logic
5. Repository queries MongoDB
6. Response serialized as JSON back to mobile

## Environment Profiles

| Profile | MongoDB | Logging | Use |
|---------|---------|---------|-----|
| dev | localhost:27017 | DEBUG | Local development |
| prod | env var | WARN | Production |

## Docker Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| mongodb | mongo:8.0 | 27017 | Database (healthcheck enabled) |
| api-server | custom (Dockerfile.backend) | 8080 | Spring Boot API server |

## Local Development Environment

**docker-compose.yml** defines:
- MongoDB with persistent volume (`mongodb_data`)
- Health check (mongosh ping every 5s)
- Backend service with Spring profile `dev`
- Custom bridge network `cookmate-network`
- MongoDB URI: `mongodb://mongodb:27017/cookmate`
