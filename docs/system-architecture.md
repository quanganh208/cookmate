# Cookmate — System Architecture

## Overview

Cookmate uses a monorepo with two main applications:

- **Mobile**: React Native Expo (SDK 55) with feature-based modular architecture, TanStack Query for offline-first caching, Zustand for UI state
- **Backend**: Spring Boot 4.0.3 REST API (Java 21) with Spring Data MongoDB, JWT & API Key authentication
- **Database**: MongoDB 8.0 (containerized)

## Architecture Diagram

```
┌──────────────────┐       HTTP/REST       ┌──────────────────────┐
│                  │  ──────────────────>   │                      │
│  Expo Mobile App │                        │  Spring Boot API     │
│  (React Native)  │  <──────────────────   │  (Java 21)           │
│                  │       JSON             │                      │
└──────────────────┘                        └────────┬─────────────┘
                                                     │
                                    ┌────────────────┼────────────────┐
                                    │                                 │
                                    ▼                                 ▼
                           ┌─────────────────────┐        ┌──────────────────┐
                           │                     │        │                  │
                           │  API Key Filter     │        │   JWT Auth       │
                           │  (X-API-Key header) │        │   (Bearer token) │
                           │                     │        │                  │
                           └─────────────────────┘        └──────────────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │   Controllers    │
                           │   (REST routes)  │
                           └────────┬─────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │   Services       │
                           │   (Business      │
                           │    logic)        │
                           └────────┬─────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │  Repositories    │
                           │  (Data access)   │
                           └────────┬─────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
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

## Backend Architecture (Feature-Based Modular)

**Design:** Decomposed from flat layered architecture into two feature modules + shared utilities.

```
Request → Shared Security Filters → Feature Controllers → Services → Repositories → MongoDB
              ↓
        (Auth Filter, JWT Filter)
```

**Module Structure:**

### Auth Feature (`com.cookmate.auth.*`)

Encapsulates all authentication logic:

- **controller/** — REST endpoints (register, login, google, refresh, me, logout)
- **service/** — Business logic (AuthService, GoogleOAuthService)
- **repository/** — Data access (UserRepository, RefreshTokenRepository)
- **model/** — Domain entities (User, RefreshToken, Role, AuthProvider)
- **dto/** — Request/response objects
- **exception/** — AuthException for auth-specific errors

### Shared Module (`com.cookmate.shared.*`)

Cross-feature utilities and infrastructure:

- **security/** — Authentication filters (ApiKeyFilter, JwtAuthenticationFilter, JwtTokenProvider)
- **config/** — Spring configuration (SecurityConfig, OpenApiConfig, CommonBeansConfig, CorsConfig, MongoConfig)
- **controller/** — Shared endpoints (HealthController)
- **exception/** — Global error handling (GlobalExceptionHandler, ResourceNotFoundException)
- **dto/** — Shared response objects (ApiResponse with unified envelope format)

**Filter Chain (Request Flow):**

1. **ApiKeyFilter** - Validates X-API-Key header (service-to-service auth)
2. **JwtAuthenticationFilter** - Validates JWT Bearer token (client auth, 15min TTL)
3. **Feature Controllers** - Route to appropriate feature endpoint
4. **Feature Services** - Execute business logic
5. **Feature Repositories** - Access MongoDB data

**Current Status:** Foundation + Authentication Phase complete. All 29 source + 4 test files migrated. 44/44 tests passing. Ready for scalable team development.

## Authentication Flow

**Registration (POST /api/auth/register):**

```
Client sends: { email, password, name }
  ↓
AuthService.register() validates & hashes password (BCrypt strength 12)
  ↓
User saved to MongoDB
  ↓
Response: { accessToken (JWT), refreshToken, user: { id, email, name } }
```

**Login (POST /api/auth/login):**

```
Client sends: { email, password }
  ↓
AuthService.login() validates credentials
  ↓
JWT (15min) + Refresh Token (30 days, stored in MongoDB with TTL auto-cleanup)
  ↓
Response: { accessToken, refreshToken, user }
```

**Google OAuth (POST /api/auth/google):**

```
Client sends: { idToken from Google }
  ↓
GoogleOAuthService verifies token with Google
  ↓
User created or matched (AuthProvider: GOOGLE)
  ↓
JWT + Refresh Token issued
  ↓
Response: { accessToken, refreshToken, user }
```

**Token Refresh (POST /api/auth/refresh):**

```
Client sends: { refreshToken }
  ↓
AuthService validates refresh token TTL in MongoDB
  ↓
New accessToken (15min) issued; refresh token may be rotated
  ↓
Response: { accessToken, refreshToken }
```

**Protected Endpoints:**

```
GET /api/auth/me (Bearer JWT)
  ↓
JwtAuthFilter extracts claims
  ↓
Returns: { user: { id, email, name, role } }
```

**Logout (POST /api/auth/logout):**

```
Client sends: { refreshToken }
  ↓
AuthService removes refresh token from MongoDB
  ↓
Response: { success: true }
```

**Password Reset (POST /api/auth/forgot-password → POST /api/auth/reset-password):**

```
Step 1: Forgot Password (POST /api/auth/forgot-password)
Client sends: { email }
  ↓
PasswordResetService generates random token, hashes (SHA-256), stores in MongoDB (TTL 15m)
  ↓
EmailService sends async HTML email with reset link: cookmate://reset?token={plain-token}
  ↓
Response: { success: true, message: "Check your email" }

Step 2: Reset Password (POST /api/auth/reset-password)
User taps link in email → app receives deep link → ResetPasswordScreen shows
User enters new password, submits form with { token, newPassword }
  ↓
PasswordResetService validates token (exists, hash matches, not expired, not used)
  ↓
AuthService updates User.password, marks reset token used
  ↓
AuthService revokes ALL refresh tokens for user (force re-login everywhere)
  ↓
Response: { success: true, message: "Password updated" }
```

## Token Lifecycle

**Access Token (JWT, 15 minutes):**

- Created on login/register/refresh
- Stored in Zustand auth store (memory only)
- Also cached in SecureStore for recovery across app restarts
- Included in `Authorization: Bearer {token}` header on all protected requests
- Expires after 15 minutes (client-side + server-side validation)
- On 401 response → single-flight refresh interceptor kicks in

**Refresh Token (30 days, stored in MongoDB):**

- Created on login/register/refresh
- Stored ONLY in SecureStore (Keychain on iOS, Keystore on Android) — never in the in-memory Zustand store
- Sent in the HTTP request body only for `POST /api/auth/refresh` and `POST /api/auth/logout`
- Rotated on every refresh call (new token issued, old one invalidated)
- Auto-cleaned up by MongoDB TTL index after 30-day expiry
- Revoked immediately on: logout, password reset, manual revocation
- Single instance per user (previous refresh tokens invalidated on new login)

**Password Reset Token (15 minutes, stored in MongoDB):**

- Generated as random string (e.g., 32 bytes)
- Plain token sent to user's email; hash stored in DB (SHA-256)
- Marked used=true after successful password reset (prevents re-use)
- Auto-cleaned up by MongoDB TTL index after 15-minute expiry
- Email contains deep link: `cookmate://reset?token={plain-token}`

## Mobile Auth Bootstrap Flow

**Cold Start (app launch):**

1. Root layout (\_layout.tsx) renders with `status: 'bootstrapping'`
2. useEffect reads **both** access + refresh tokens from SecureStore (fail-open on read errors)
3. If either is missing → flip to `anonymous` and stop
4. Prime the Zustand store with the access token so the api-client interceptor can inject the `Authorization: Bearer` header
5. Call `GET /api/auth/me` using the **access token** (not the refresh token); if it expires, the single-flight 401 interceptor will call `/auth/refresh` and retry once
6. If 200: hydrate Zustand auth store (session + status: 'authenticated')
7. If hard auth failure (401/403 after refresh also failed, or `INVALID_TOKEN`): clear SecureStore + store (status: 'anonymous')
8. If transient failure (offline, 5xx, network error): **keep** SecureStore intact and flip to `anonymous` so the splash dismisses; the next authenticated request retries the refresh flow
9. Render actual app only after bootstrap completes (guard on `status !== 'bootstrapping'`)

**Protected Request with 401 Response:**

1. Client sends `GET /api/recipe/:id` with accessToken
2. Server returns 401 (token expired)
3. api-client interceptor acquires single-flight lock, calls refresh endpoint
4. POST /api/auth/refresh with refreshToken
5. Server returns new accessToken (+ optionally new refreshToken)
6. Lock released; original request retried with new accessToken
7. If refresh fails (401, 4xx): emit auth:logout event, clear store, replace to login screen

## Deep Link Scheme

**Format:** `cookmate://reset?token={token}`

**Handling:**

1. Expo Linking listener detects deep link
2. Routes to `(auth)/reset-password` screen
3. ResetPasswordScreen extracts token from route params
4. Pre-fills token field, user enters password
5. Submits to `POST /api/auth/reset-password`

## Data Flow

1. Mobile app sends HTTP request to `/api/*` with optional `X-API-Key` header and/or `Authorization: Bearer {jwt}`
2. ApiKeyFilter checks API key (if required endpoint)
3. JwtAuthFilter extracts and validates JWT claims
4. Controller validates input, delegates to Service
5. Service executes business logic
6. Repository queries MongoDB
7. Response serialized as JSON back to mobile
8. Refresh tokens auto-cleanup via MongoDB TTL index

## Environment Profiles

| Profile | MongoDB         | Logging | Use               |
| ------- | --------------- | ------- | ----------------- |
| dev     | localhost:27017 | DEBUG   | Local development |
| prod    | env var         | WARN    | Production        |

## Docker Services

| Service    | Image                       | Port  | Purpose                        |
| ---------- | --------------------------- | ----- | ------------------------------ |
| mongodb    | mongo:8.0                   | 27017 | Database (healthcheck enabled) |
| api-server | custom (Dockerfile.backend) | 8080  | Spring Boot API server         |

## Local Development Environment

**docker-compose.yml** defines:

- MongoDB with persistent volume (`mongodb_data`)
- Health check (mongosh ping every 5s)
- Backend service with Spring profile `dev`
- Custom bridge network `cookmate-network`
- MongoDB URI: `mongodb://mongodb:27017/cookmate`
