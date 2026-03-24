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

**Architecture (Feature-Based Modular):**

```
com.cookmate/
├── CookmateApplication.java               Entry point
├── auth/                                   Auth feature module
│   ├── controller/
│   │   ├── AuthController.java            Authentication endpoints
│   │   └── AuthControllerIntegrationTest  Integration tests
│   ├── service/
│   │   ├── AuthService.java               User registration, login, token management
│   │   ├── GoogleOAuthService.java        Google OAuth integration
│   │   └── AuthServiceTest.java           Service unit tests
│   ├── repository/
│   │   ├── UserRepository.java            User queries
│   │   └── RefreshTokenRepository.java    Refresh token queries with TTL
│   ├── model/
│   │   ├── User.java                      User document
│   │   ├── RefreshToken.java              Refresh token document (auto-cleanup via TTL)
│   │   ├── Role.java                      User roles enum
│   │   └── AuthProvider.java              OAuth provider enum (LOCAL, GOOGLE)
│   ├── dto/
│   │   ├── AuthResponse.java              Auth response with tokens & user
│   │   ├── UserResponse.java              User data response
│   │   ├── LoginRequest.java              Login request
│   │   ├── RegisterRequest.java           Registration request
│   │   ├── GoogleAuthRequest.java         Google OAuth request
│   │   └── RefreshTokenRequest.java       Token refresh request
│   └── exception/
│       └── AuthException.java             Authentication-related errors
├── shared/                                 Shared utilities & config
│   ├── controller/
│   │   └── HealthController.java          Health check endpoint
│   ├── service/                            (Reserved for future cross-feature services)
│   ├── repository/                         (Reserved for future shared data access)
│   ├── security/
│   │   ├── ApiKeyFilter.java              X-API-Key header validation
│   │   ├── JwtAuthenticationFilter.java   JWT Bearer token validation
│   │   ├── JwtTokenProvider.java          JWT creation & parsing
│   │   └── JwtTokenProviderTest.java      JWT unit tests
│   ├── config/
│   │   ├── OpenApiConfig.java             Swagger/OpenAPI setup
│   │   ├── SecurityConfig.java            Spring Security filter chain
│   │   ├── CommonBeansConfig.java         Shared bean definitions (PasswordEncoder, etc)
│   │   ├── CorsConfig.java                CORS configuration
│   │   └── MongoConfig.java               MongoDB connection settings
│   ├── exception/
│   │   ├── GlobalExceptionHandler.java    Centralized error handling
│   │   └── ResourceNotFoundException.java 404 handling
│   └── dto/
│       └── ApiResponse.java               Unified API response envelope
└── test/
    └── CookmateApplicationTests            Root application tests
```

**Key Entry Point:** `backend/src/main/java/com/cookmate/CookmateApplication.java`
**Port:** 8080 (configurable via `server.port`)
**Profiles:** `dev` (local, MongoDB @ localhost:27017), `prod` (env vars)
**Database Driver:** MongoDB Java Driver via Spring Data MongoDB

**Authentication:**

- **API Key:** X-API-Key header validation (ApiKeyFilter)
- **JWT:** Bearer token validation (JwtAuthFilter)
- **Password Hashing:** BCrypt with strength 12
- **Token Lifecycle:**
  - Access Token: 15 minutes
  - Refresh Token: 30 days (stored in MongoDB with TTL auto-cleanup)
- **OAuth:** Google OAuth2 integration (GoogleOAuthService)

**Endpoints Implemented:**

- `GET /api/health` — Health check
- `POST /api/auth/register` — User registration (email, password, name)
- `POST /api/auth/login` — Email/password login
- `POST /api/auth/google` — Google OAuth login
- `POST /api/auth/refresh` — Token refresh (refresh token rotation)
- `GET /api/auth/me` — Current user profile (JWT required)
- `POST /api/auth/logout` — Logout (revokes refresh token)

## Database (MongoDB 8.0)

**Collections:**

- `users` — User accounts with credentials, OAuth providers
- `refreshTokens` — Active refresh tokens with TTL auto-cleanup (30-day expiry)
- `recipes` — Recipe documents (planned Phase 4)
- `follows` — User follow relationships (planned Phase 5)
- `likes` — Like/bookmark mappings (planned Phase 5)
- `comments` — Comments on recipes (planned Phase 5)
- `ratings` — Recipe ratings (planned Phase 5)

**Connection:**

- Local: `mongodb://mongodb:27017/cookmate` (Docker)
- Production: `MONGODB_URI` environment variable

**Indexes:**

- `users.email` — Unique constraint
- `refreshTokens.expireAt` — TTL index for auto-cleanup

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
**Status:** Testing, linting, Docker builds configured; deployment pending

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
- `spring-boot-starter-security` — Authentication & authorization
- `org.projectlombok:lombok` — Boilerplate reduction
- `spring-boot-starter-validation` — @Valid annotations
- `spring-boot-devtools` — Hot reload
- `io.jsonwebtoken:jjwt` — JWT creation & validation
- `com.google.auth:google-auth-library-oauth2-http` — Google OAuth

## API Contracts

**Base URL:** `http://localhost:8080/api` (dev), `https://api.cookmate.com` (prod)

**Authentication Headers:**

- `X-API-Key: {api-key}` — Optional API key validation
- `Authorization: Bearer {jwt}` — JWT token for protected endpoints

**Implemented Endpoints:**

- `GET /api/health` — Health check (`{"status": "ok"}`)
- `POST /api/auth/register` — Register user (Phase 3)
- `POST /api/auth/login` — Login (Phase 3)
- `POST /api/auth/google` — Google OAuth (Phase 3)
- `POST /api/auth/refresh` — Refresh token (Phase 3)
- `GET /api/auth/me` — Current user (Phase 3)
- `POST /api/auth/logout` — Logout (Phase 3)

**Planned Endpoints (Phase 4+):**

- `GET /recipes` — List recipes, paginated (Phase 4)
- `POST /recipes` — Create recipe (Phase 4)
- `GET /recipes/{id}` — Recipe detail (Phase 4)

**Response Format (Unified ApiResponse Envelope):**

Success response:

```json
{
  "success": true,
  "data": { "id": "123", "name": "Pasta Carbonara" },
  "timestamp": "2026-03-24T12:00:00Z"
}
```

Error response:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Recipe with ID 123 not found"
  },
  "timestamp": "2026-03-24T12:00:00Z"
}
```

Authentication errors use same format:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password incorrect"
  },
  "timestamp": "2026-03-24T12:00:00Z"
}
```

## Development Workflow

1. **Clone & Setup:** `git clone`, `pnpm install`, `docker compose up`
2. **Mobile Dev:** `cd apps/mobile && pnpm start` (Expo Go or emulator)
3. **Backend Dev:** `cd backend && ./mvnw spring-boot:run` (dev profile)
4. **API Testing:** Use Postman, curl, or REST Client with auth headers
5. **Git:** Create feature branches, make PR, ensure CI passes

## Standards References

See [Code Standards](code-standards.md), [System Architecture](system-architecture.md), and [Design Guidelines](design-guidelines.md) for detailed conventions.
