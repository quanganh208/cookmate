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

**Architecture:** Feature-based modular design with 6 core features + shared utilities

**Structure:**

```
apps/mobile/
├── app/                      Expo Router routes (thin wrappers only)
│   ├── _layout.tsx           Root stack + QueryClientProvider + fonts
│   ├── (tabs)/               Tab navigator group
│   │   ├── _layout.tsx       5-tab bottom navigation
│   │   ├── index.tsx         Home screen route
│   │   ├── search.tsx        Search screen route
│   │   ├── create.tsx        Create recipe screen route
│   │   ├── saved.tsx         Favorites screen route
│   │   └── profile.tsx       Profile screen route
│   ├── recipe/[id].tsx       Recipe detail screen route
│   └── +not-found.tsx        404 page
├── features/                 6 self-contained feature modules
│   ├── home/                 Home feed feature
│   │   ├── components/       HomeHeader, SearchBarShortcut, FeaturedCarousel, TrendingSection
│   │   ├── screens/          HomeScreen component
│   │   └── index.ts          Barrel export
│   ├── recipes/              Recipe CRUD feature
│   │   ├── api/              RecipesRepository (HTTP + caching)
│   │   ├── hooks/            useRecipes query hook
│   │   ├── screens/          RecipeDetailScreen
│   │   ├── store.ts          Zustand UI state (filters, selections)
│   │   ├── types.ts          Recipe, Author, Category interfaces
│   │   └── index.ts          Barrel export
│   ├── search/               Search feature
│   │   ├── screens/          SearchScreen
│   │   └── index.ts          Barrel export
│   ├── favorites/            Saved/bookmarked recipes
│   │   ├── screens/          FavoritesScreen
│   │   └── index.ts          Barrel export
│   ├── create-recipe/        Recipe creation feature
│   │   ├── screens/          CreateRecipeScreen
│   │   └── index.ts          Barrel export
│   └── profile/              User profile feature
│       ├── screens/          ProfileScreen
│       └── index.ts          Barrel export
├── shared/                   Cross-feature utilities
│   ├── components/           Reusable UI components
│   │   ├── animated-pressable.tsx    Press animation wrapper
│   │   ├── category-chips.tsx        Category filter chips
│   │   ├── recipe-card-featured.tsx  Full-width featured card
│   │   ├── recipe-card-compact.tsx   Grid-layout compact card
│   │   └── index.ts          Barrel export
│   ├── api/                  HTTP & state management
│   │   ├── api-client.ts     Axios-like HTTP wrapper
│   │   ├── mmkv-storage.ts   Fast local storage (offline caching)
│   │   ├── query-client-provider.tsx TanStack Query + persist setup
│   │   └── index.ts          Barrel export
│   ├── constants/            App-wide constants
│   │   ├── colors.ts         Warm palette (primary, secondary, etc)
│   │   ├── fonts.ts          Typography presets
│   │   ├── mock-recipes.ts   15 mock recipes (for testing)
│   │   └── index.ts          Barrel export
│   ├── types/                Global TypeScript types
│   │   └── index.ts          Barrel re-exports (Recipe, Author, etc)
│   └── hooks/                (future: auth, navigation utilities)
└── services/                 (empty, reserved for external integrations)
```

**Key Entry Point:** `apps/mobile/app/_layout.tsx` — Root layout wraps app in QueryClientProvider, loads fonts, initializes MMKV
**Routing Strategy:** File-based via Expo Router; route files are 2-line wrappers (import screen + export)
**State Management:**

- UI state: Zustand (filters, selections, UI toggled state)
- Server state: TanStack React Query (recipes, user data, async operations)
- Offline caching: MMKV storage + TanStack Query sync persister
  **Feature Module Pattern:** Each feature is self-contained with own components, hooks, api, store, types; imports shared utilities via `@/shared/*`
  **Shared Components:** 4 reusable components (AnimatedPressable, CategoryChips, RecipeCardFeatured, RecipeCardCompact)
  **API Layer:** Repository pattern (RecipesRepository) abstracts HTTP calls; TanStack Query wraps with caching + offline sync
  **Offline Strategy:** MMKV + TanStack Query sync persister caches recipe data locally for offline browsing
  **Styling:** React Native StyleSheet + warm color palette (primary #FF7A3D, secondary #8B6914)
  **Animations:** Reanimated for card press effects via AnimatedPressable
  **Images:** expo-image with blurhash placeholders
  **Lists:** FlashList for high-performance scrolling
  **Navigation:** 5-tab bottom nav (Home/Search/Create/Saved/Profile) with recipe detail stack modal
  **Path Aliases:** `@/*` maps to root `./` for clean imports across features

## Backend API (backend/)

**Stack:** Spring Boot 4.0.3, Java 21 LTS, Spring Data MongoDB, Lombok, Maven

**Architecture (Layered):**

```
com.cookmate/
├── CookmateApplication.java  Entry point
├── controller/               HealthController only (pending Phase 3)
├── service/                  Scaffolded — empty (pending Phase 3)
├── repository/               Scaffolded — empty (pending Phase 3)
├── model/                    Scaffolded — empty (pending Phase 3)
├── dto/                      Scaffolded — empty (pending Phase 3)
├── config/                   CorsConfig, MongoConfig, OpenApiConfig (implemented)
└── exception/                Scaffolded — empty (pending Phase 3)
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
- `zustand` 5.x (lightweight UI state management for filters, selections)
- `@tanstack/react-query` 5.x (server state + caching)
- `@tanstack/react-query-persist-client` (persistent cache)
- `@tanstack/query-sync-storage-persister` (offline sync persister)
- `react-native-mmkv` 4.x (fast local storage for offline caching)
- `expo-image` (optimized images with blurhash)
- `react-native-reanimated` (spring animations)
- `@shopify/flash-list` (high-performance scrolling)
- `expo-linear-gradient` (overlay gradients)
- `@expo-google-fonts/lora`, `@expo-google-fonts/dm-sans` (custom fonts)
- `expo-splash-screen` (font loading splash screen)
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

**Implemented Endpoints:**

- `GET /api/health` — Health check (`{"status": "ok"}`)

**Planned Endpoints (Phase 3+):**

- `POST /auth/register` — User registration (Phase 3)
- `POST /auth/login` — Login, JWT token (Phase 3)
- `GET /users/{id}` — User profile (Phase 3)
- `GET /recipes` — List recipes, paginated (Phase 4)
- `POST /recipes` — Create recipe (Phase 4)
- `GET /recipes/{id}` — Recipe detail (Phase 4)

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
