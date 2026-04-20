# Cookmate Changelog

All notable changes to the Cookmate project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added (Phase 4 Slice 4.2 — Full-Text Recipe Search)

**Backend:**

- `GET /api/recipes/search?q=<query>&page=0&size=20` — public full-text search over title +
  description, returns `Page<RecipeResponse>` sorted by text score.
- `RecipeRepositoryCustom` + `RecipeRepositoryCustomImpl` — `MongoTemplate`-backed `searchByText`
  using `TextCriteria.forLanguage("none")` + `TextQuery.sortByScore()` (Spring Data derived queries
  can't build sort-by-text-score).
- `MongoIndexMigration` — `@PostConstruct` reconciler that drops the stale auto-created text index
  if `default_language` differs from `"none"` and recreates it correctly (supports Vietnamese +
  mixed-locale titles).
- `SlidingWindowRateLimiter` + `RecipeSearchRateLimiter` — in-memory sliding-window rate limit
  (60 req/min/user, or IP when unauthenticated). Same pattern as Phase 3.5 password-reset.
  `RateLimitedException` + handler → 429 `RATE_LIMITED`.
- Global page-size cap: `WebConfig.addArgumentResolvers` registers
  `PageableHandlerMethodArgumentResolver` with `setMaxPageSize(50)` — prevents `?size=10000` DoS
  on any pageable endpoint.
- `GlobalExceptionHandler` now maps `IllegalArgumentException` +
  `ConstraintViolationException` → 400 `BAD_REQUEST`.

**Mobile:**

- Search feature: `searchRepository`, `useRecipesSearch` (infinite query, `enabled` on non-empty
  trimmed `q`), `useRecentSearches` (MMKV, per-user keyed, corruption-safe), pure helpers
  `dedupAndCap` + `keyFor` + `readAll` for testing.
- `useDebouncedValue<T>` generic trailing-edge debounce in `shared/hooks/` (300ms default).
- Search screen rewritten from stub into full state machine: idle (`RecentSearchesList`) / loading /
  error (`ErrorView` with retry) / empty (`SearchEmptyState`) / results
  (`SearchResultsGrid` + infinite scroll). Auto-focus input with clear button; pressing Enter or
  tapping a recent entry persists it to MMKV.
- `RecentSearchesList`, `SearchEmptyState`, `SearchResultsGrid` components.
- Recent searches scoped by `userId` — switching accounts or logging out clears the prior bucket.

**App config:**

- `android.allowBackup=false` in `app.config.js` — prevents MMKV (recent searches, query cache)
  from being backed up to Google Drive and restored onto a different device / user.

**Testing:**

- New mobile unit tests: `search-repository.test.ts` (URL encoding, pagination defaults),
  `use-recent-searches.test.ts` (pure helpers: dedup+cap, key scoping, corrupt-payload recovery).
  Hook-rendering tests skipped due to `react-test-renderer` version pin mismatch between
  `jest-expo` and `@testing-library/react-native`; pure helpers cover the logic.
- New backend: `RecipeSearchIntegrationTest` (6 cases: Vietnamese match, English match, empty
  400, pagination, page-size cap 50, rate-limit 429).
- 43/43 mobile tests (up from 31 after 4.1); 69/69 backend tests (up from 63 after 4.1).

### Added (Phase 4 Slice 4.1 — Recipe Detail + Wire Format Alignment)

**Mobile:**

- Extended `Recipe` type (`shared/types/recipe.ts`) to match BE `RecipeResponse` — added viewCount,
  serving, prepTime, cuisine, status, authorId, updatedAt, nested `steps[]` and `ingredients[]`.
  Removed mobile-only `isBookmarked` (moved to Phase 5 social scope).
- New generic `Page<T>` type mirroring Spring Data Page wire shape (content, totalElements,
  totalPages, size, number, first, last, numberOfElements).
- New types: `RecipeIngredient`, `RecipeStep`, `RecipeStatus`, `RecipeDifficulty`, `Author`
  (with `displayName` aligned to BE `UserResponse`).
- `recipes-repository.ts` rewritten: `list`/`findByCategory`/`findFeatured`/`findByAuthor` return
  typed `Page<Recipe>` with `{page, size}` params; `getById(id, { view })` supports the new
  view-count gate (defaults to `view=false` for prefetch safety).
- New hooks: `useInfiniteRecipes`, `useFeaturedRecipes`, `useRecipesByCategory` (TanStack
  `useInfiniteQuery` with `getNextPageParam` driven by `Page.last` + `Page.number`); `useRecipe`
  for single-recipe detail queries.
- Recipe detail screen rewritten: `RecipeHero`, `RecipeIngredients`, `RecipeSteps` sub-components;
  `RecipeDetailSkeleton` loading placeholder; shared `ErrorView` with retry CTA.
- Home screen wired to live API: pull-to-refresh, onEndReached infinite pagination, trending
  derived from first page, category filtering via `useRecipesByCategory`.
- `RecipeCardCompact`, `RecipeCardFeatured`, `FeaturedCarousel` updated for new `Author.displayName`
  - optional author shape.

**Backend:**

- `GET /api/recipes/{id}?view=true|false` — optional query param (default `true` for backward
  compat). When `view=false`, the server skips `incrementViewCount` (prevents double-counting on
  prefetch/batch paths).

**Removed:**

- `apps/mobile/shared/constants/mock-recipes.ts` (15-entry mock dataset) + re-export in
  `shared/constants/index.ts`. All mock fallbacks in hooks and screens removed.

**Testing:**

- New mobile unit tests: `recipes-repository.test.ts` (7 cases: pagination defaults, view gate
  default false, view=true opt-in, URL encoding for category + authorId, size defaults),
  `use-recipes.test.ts` (3 cases: `flattenRecipePages`).
- New backend unit test: `RecipeControllerViewGateTest` (2 cases: default view=true increments,
  view=false skips).
- 28/28 mobile tests passing (up from 18); 63/63 backend tests passing (up from 61).

### Planned

- Phase 4.2: Search endpoint + screen (Mongo `$text` + ingredient autocomplete)
- Phase 4.3: Create Recipe + R2 upload + orphan janitor
- Phase 4.4: Favorites (Collection-based)
- Phase 5: Social features (followers, ratings, comments)
- Phase 6: AI-powered recipe suggestions

## [0.3.0] — 2026-04-07

### Added (Mobile Authentication UI + Backend Password Reset)

**Backend:**

- `POST /api/auth/forgot-password` — Initiate password reset with email delivery
- `POST /api/auth/reset-password` — Complete password reset with token validation
- `PasswordResetService` — SHA-256 token hashing, 15-minute TTL, one-time used flag, in-memory rate limiting (3/hour/email)
- `EmailService` — Async Gmail SMTP delivery with HTML templates (@Async fail-open)
- `PasswordResetToken` model with MongoDB TTL index (auto-cleanup 15m)
- Password reset success revokes ALL user refresh tokens (force re-login everywhere)
- @EnableAsync annotation for async email processing

**Mobile:**

- Auth feature module with 8 endpoints (login, register, google, refresh, me, logout, forgot-password, reset-password)
- Zustand auth store with session state + bootstrap status (bootstrapping/authenticated/anonymous)
- Login/register screens with Zod form validation + react-hook-form
- Forgot/reset password screens with email + token validation flows
- Google Sign-In integration with native credentials
- 8 auth components (AuthFormField, AuthSubmitButton, AuthHeader, AuthErrorBanner, GoogleSignInButton, LoginPromptCard, AuthGate, AuthFooterLink)
- Token storage: SecureStore (Keychain/Keystore) for refresh token; memory + SecureStore for access token
- Single-flight 401 refresh interceptor with auto-retry on Bearer token expiry
- Automatic logout on refresh token expiration + auth:logout event pub-sub
- Protected route gates via AuthGate wrapper + useRequireAuth hook
- Root layout bootstrap: hydrate session from SecureStore, call /auth/me, gate render on completion
- Feature gating: Favorites/Create screens wrapped in AuthGate; Profile with LoginPromptCard for guests
- Deep link support: `cookmate://reset?token=xxx` for password reset links
- Error mapper: backend error codes → English user messages (e.g. BAD_CREDENTIALS → "Incorrect email or password")

**Mobile Dependencies:**

- `expo-secure-store` — Keychain/Keystore token storage
- `@react-native-google-signin/google-signin` — Native Google Sign-In
- `react-hook-form` — Form state management
- `zod` — Schema validation
- `@hookform/resolvers` — Form validation integration

**Backend Dependencies:**

- `spring-boot-starter-mail` — Email sending via SMTP

### Changed (Error Code Wire Format)

**AuthException Refactor:**

- New semantic `code` field (BAD_CREDENTIALS, EMAIL_TAKEN, INVALID_TOKEN, OAUTH_ONLY, EMAIL_EXISTS_WITH_PASSWORD, RESET_TOKEN_INVALID, RESET_TOKEN_EXPIRED, RESET_RATE_LIMITED)
- `ApiResponse.error.code` now returns semantic code instead of HTTP status name
- `GlobalExceptionHandler` updated to use `ex.getCode()` for AuthException responses
- Wire-format change may affect API consumers — verify error.code mapping

### Verified

- Mobile: 18/18 tests passing (api-client single-flight, auth error mapper)
- Backend: 61/61 tests passing (9 new PasswordResetServiceTest, 3 new EmailServiceTest, 5 new AuthControllerIntegrationTest)
- All endpoints functional: forgot-password, reset-password, refresh with 401 retry

### Known Risks (Accepted MVP Trade-offs)

- Concurrent reset race on `used` flag — read-check-write, not atomic findAndModify (documented in risk register)
- Universal links not set up — reset link uses `cookmate://` custom scheme only
- Google Sign-In native creds require manual setup (iosUrlScheme placeholder in apps/mobile/app.config.js)

## [0.2.2] — 2026-03-24

### Changed (API Response Format Standardization)

**Unified Response Envelope:**

- **New unified wrapper:** `ApiResponse<T>` generic class for all responses (success & error)
  - Success: `{ "success": true, "data": {...}, "timestamp": "..." }`
  - Error: `{ "success": false, "error": { "code": "...", "message": "..." }, "timestamp": "..." }`
- **Removed:** Old `ErrorResponse` class (replaced by `ApiResponse.ErrorDetail`)
- **Static factory methods:** `ApiResponse.ok(data)`, `ApiResponse.ok()`, `ApiResponse.error(code, msg)`
- **Updated endpoints:** All 7 endpoints now return wrapped responses
  - Auth: register, login, google, refresh, me, logout (6 endpoints)
  - Health: status (1 endpoint)
- **Logout status change:** Changed from 204 No Content to 200 OK with `{ "success": true, data: null }`
- **Manual wrapping strategy:** Controllers wrap at response layer (no `ResponseBodyAdvice` — YAGNI)
- **GlobalExceptionHandler updated:** All 6 exception handlers return `ApiResponse` envelope

### Verified

- All 44 unit & integration tests passing
- Response format consistent across all endpoints
- Error responses include code and message in standardized structure
- No frontend breaking changes (was already returning multiple formats)

### Why Unified Envelope?

- **Predictable:** Frontend always knows response shape
- **Extensible:** Timestamp, additional metadata easy to add
- **Type-safe:** Generic `<T>` for compile-time type checking
- **Backward compatible:** Success data still at root `data` field; error structure clarified

## [0.2.1] — 2026-03-24

### Changed (Backend Refactor)

**Feature-Based Modularization:**

- **Refactored package structure** from flat layered to feature-based modules:
  - `com.cookmate.auth.*` — Authentication feature (controller, service, repository, model, dto, exception)
  - `com.cookmate.shared.*` — Cross-feature utilities (security, config, exception, dto, controller)
  - Single-responsibility packages enable parallel team development
- **File moves:** 29 source files + 4 test files relocated to new package structure
  - 16 auth-specific files → `com.cookmate.auth/` (with 2 test files)
  - 12 shared files + 1 health controller → `com.cookmate.shared/` (with 1 test file)
  - Root application tests remain at `com.cookmate/` root
- **Package updates:** Updated 47 package declarations across all source files
- **Import updates:** Fixed 200+ cross-module imports after refactoring
- **Import ordering:** Applied spotless:apply for Google Java Format compliance

### Verified

- All 44 unit & integration tests passing (JwtTokenProviderTest: 15, AuthServiceTest: 15, AuthControllerIntegrationTest: 13, CookmateApplicationTests: 1)
- Build successful with `./mvnw verify`
- Checkstyle compliance verified
- Zero compilation errors; no logic changes, only structural reorganization
- Spring component scanning works correctly with new package hierarchy

### Why Feature-Based?

- **Scalability:** Clearer responsibility boundaries enable 3-4 developers working independently
- **Maintainability:** Feature modules self-contained; future features (recipes, social) easier to add
- **Onboarding:** New team members understand which files belong to which feature
- **Testing:** Feature tests co-located with feature code; easier to find test coverage

## [0.2.0] — 2026-03-24

### Added (Authentication & Security)

**Backend Authentication:**

- Two-tier authentication system:
  - **API Key Filter** (`ApiKeyFilter.java`) — Validates X-API-Key header for service-to-service auth
  - **JWT Filter** (`JwtAuthFilter.java`) — Validates Bearer tokens from mobile clients
- User authentication endpoints:
  - `POST /api/auth/register` — User registration with email & password
  - `POST /api/auth/login` — Login with email/password, returns JWT + refresh token
  - `POST /api/auth/google` — Google OAuth2 login (GoogleOAuthService)
  - `POST /api/auth/refresh` — Refresh access token (rotation support)
  - `GET /api/auth/me` — Get current user profile (JWT required)
  - `POST /api/auth/logout` — Logout with refresh token revocation
- Domain models:
  - `User.java` — User document with email, password hash, OAuth provider, roles
  - `RefreshToken.java` — Refresh token with TTL auto-cleanup (30-day expiry)
  - `Role.java` — Enum: USER, ADMIN
  - `AuthProvider.java` — Enum: LOCAL, GOOGLE
- DTOs for request/response:
  - `AuthResponse` — Returns accessToken, refreshToken, user
  - `UserResponse` — User profile (id, email, name, role)
  - `LoginRequest`, `RegisterRequest`, `GoogleAuthRequest`, `RefreshTokenRequest`
  - `ErrorResponse` — Standardized error format
- Security infrastructure:
  - `SecurityConfig.java` — Spring Security bean setup, filter chain order
  - `CommonBeansConfig.java` — PasswordEncoder (BCrypt strength 12), JWT provider beans
  - Global exception handler (`GlobalExceptionHandler.java`) with custom exceptions
  - `AuthException`, `ResourceNotFoundException` for domain errors
- Authentication features:
  - BCrypt password hashing (strength 12)
  - JWT with 15-minute access token TTL
  - Refresh tokens with 30-day TTL, stored in MongoDB
  - Automatic refresh token cleanup via MongoDB TTL index
  - Google OAuth2 token verification
  - Automatic user creation on first OAuth login
  - User role-based access control (RBAC)

**Backend Repositories & Services:**

- `UserRepository` — Spring Data MongoDB user queries (findByEmail, etc.)
- `RefreshTokenRepository` — Manage refresh token persistence
- `AuthService` — Orchestrates registration, login, token refresh, logout
- `GoogleOAuthService` — Verifies Google ID tokens, creates/matches users

**Configuration:**

- Updated `pom.xml` with Spring Security and JWT dependencies
- Spring profile-specific configs (dev, prod)
- OpenAPI/Swagger integration for auth endpoints

**Documentation:**

- Updated `system-architecture.md` — Added security layer, auth flow, filter chain
- Updated `codebase-summary.md` — Added auth endpoints, packages, models
- Updated `code-standards.md` — Added security conventions (API key, JWT, OAuth, RBAC)
- Updated `development-roadmap.md` — Marked Phase 3 complete, set M3 milestone
- Added changelog entry

### Changed

- `backend/pom.xml` — Added spring-boot-starter-security, jjwt, google-auth-library-oauth2-http
- `backend/src/main/resources/application.yml` — JWT secret, API key config (env vars)
- `backend/src/main/resources/application-dev.yml` — Dev-specific JWT/API key values
- `backend/src/main/java/com/cookmate/config/OpenApiConfig.java` — Updated for auth endpoints
- `CookmateApplication.java` — Entry point with security enabled

### Security

- Password hashing with BCrypt strength 12 (not 10)
- JWT token expiration (15 min access, 30 day refresh)
- API Key validation before JWT processing
- Google OAuth2 token verification
- Protected endpoints require `@PreAuthorize` or JWT validation
- Error responses never expose stack traces
- Refresh tokens excluded from API responses
- MongoDB TTL index on RefreshToken for auto-cleanup

### Known Issues

- Mobile authentication UI not yet implemented (Phase 3.5)
- JWT secret must be rotated in production
- Google OAuth requires production credentials setup
- Refresh token rotation strategy to be finalized in Phase 3.5

## [0.1.1] — 2026-03-06

### Added (CI Integration)

- **Frontend CI Enhancements:**
  - Jest testing framework with jest-expo preset for React Native testing
  - Sample test suite in `apps/mobile/__tests__/` with basic sanity checks
  - `npx expo export --platform web` build verification step
  - Added test and build jobs to `frontend-ci.yml` workflow
  - pnpm store caching via `actions/setup-node` (cache: 'pnpm')
- **Backend CI Enhancements:**
  - Maven Checkstyle plugin integration with Google Java style configuration
  - `backend/checkstyle.xml` with relaxed rules (failOnViolation=false)
  - Docker Buildx setup for containerized builds in CI
  - Docker layer caching via GitHub Actions cache backend
  - Added Docker build job to `backend-ci.yml` workflow
  - Maven dependency caching (already configured via setup-java)
- **CI/CD Improvements:**
  - Reordered frontend CI: pnpm setup before Node setup for proper cache detection
  - Updated workflow dependencies: Phase 1 & 2 run in parallel, Phase 3 runs after
  - All 3 cache strategies integrated: pnpm, Docker, Maven

### Changed

- `.github/workflows/frontend-ci.yml` — Restructured with test + build + cache
- `.github/workflows/backend-ci.yml` — Added Checkstyle + Docker + cache
- `apps/mobile/package.json` — Added Jest deps + test script
- `backend/pom.xml` — Added maven-checkstyle-plugin

### Created

- `apps/mobile/jest.config.ts` — Jest configuration
- `apps/mobile/__tests__/app.test.tsx` — Sample test
- `backend/checkstyle.xml` — Checkstyle rules

## [0.1.0] — 2026-03-06

### Added

- **Monorepo Scaffold:** Initialized pnpm workspaces for multi-package management
- **Mobile App:** React Native Expo SDK 55 with Expo Router v7 for file-based routing
  - TypeScript 5.x with strict mode enabled
  - Expo routing structure (`app/_layout.tsx`, tab-based navigation)
  - Foundation for components, hooks, services, and types directories
- **Backend API:** Spring Boot 4.0.3 REST API with Java 21 LTS
  - Layered architecture (Controller → Service → Repository)
  - Spring Data MongoDB integration
  - Lombok for boilerplate reduction
  - Global error handling with @ControllerAdvice
  - Spring Boot Actuator for health checks
- **Database:** MongoDB 8.0 containerized with Docker
  - Persistent volume for data retention
  - Health checks every 5 seconds
  - Initialized with `mongo-init.js` script
- **Docker Compose:** Local development environment setup
  - MongoDB service with networking
  - Spring Boot API service with dev profile
  - Custom `cookmate-network` bridge for inter-container communication
  - Service dependency management
- **CI/CD:** GitHub Actions workflows (See v0.1.1 for full testing and caching setup)
  - `frontend-ci.yml` — ESLint, TypeScript, build verification
  - `backend-ci.yml` — Maven build, unit tests
  - Automated on PR and push to main
- **Code Standards:**
  - ESLint 9.x and Prettier for code formatting
  - Comprehensive naming conventions (kebab-case files, PascalCase components, camelCase functions)
  - File structure guidelines for mobile (pages, components, hooks, services)
  - Java package structure (controller, service, repository, model, dto, config, exception)
- **Documentation:**
  - `project-overview-pdr.md` — Product vision and requirements
  - `code-standards.md` — Coding conventions for TypeScript and Java
  - `system-architecture.md` — Monorepo layout, layered architecture, data flow
  - `design-guidelines.md` — Mobile-first design principles, accessibility (WCAG 2.1 AA)
  - `development-roadmap.md` — 5-phase roadmap with milestones and success metrics
  - `codebase-summary.md` — High-level overview of repository structure and key entry points
  - `deployment-guide.md` — Local dev setup, Docker builds, production config, troubleshooting
  - `project-changelog.md` — This file

### Infrastructure

- **Versions:**
  - Node.js 22.x, pnpm 10.7.0
  - React 19.2.0, React Native 0.83.2
  - Spring Boot 4.0.3 (upgraded from 3.4)
  - MongoDB 8.0 (upgraded from 7.0)
  - Maven 3.9.x wrapper
  - ESLint 9.x (upgraded from 8.x)
- **Project Files:**
  - `.editorconfig` — Cross-editor formatting consistency
  - `.prettierrc` — Prettier configuration
  - `eslint.config.mjs` — ESLint configuration (flat config format)
  - `.github/workflows/` — CI/CD pipelines
  - `docker-compose.yml` — Local environment orchestration
  - `docker/Dockerfile.backend` — Multi-stage backend build
  - `pnpm-workspace.yaml` — Workspace configuration

### Configuration

- Spring profiles: `dev` (localhost MongoDB) and `prod` (env var config)
- CORS configured for dev ports (localhost:3000, localhost:8081)
- MongoDB connection pooling and driver setup
- Server port: 8080 (configurable)

### Fixed

- N/A (initial release)

### Deprecated

- N/A (initial release)

### Removed

- N/A (initial release)

### Security

- Spring Security ready (not yet implemented)
- Input validation framework in place (@Valid)
- Error responses sanitized (no stack traces in response)

### Known Issues

- TODO: Image upload service not yet selected (AWS S3, Firebase, Cloudinary)
- TODO: JWT secrets and sensitive config needs secure storage
- TODO: Monitoring and alerting not yet configured
- TODO: Database connection pooling needs tuning for production

## Version History

| Version | Release Date | Phase          | Highlights                                                  |
| ------- | ------------ | -------------- | ----------------------------------------------------------- |
| 0.1.0   | 2026-03-06   | Foundation     | Monorepo, mobile + backend scaffolds, Docker dev env        |
| 0.1.1   | 2026-03-06   | CI Integration | Jest tests, Checkstyle, Docker build, multi-stage caching   |
| 0.2.0   | 2026-03-24   | Auth           | User registration, JWT + refresh tokens, Google OAuth, RBAC |
| 0.2.2   | 2026-03-24   | API Envelope   | Unified ApiResponse format, auth error codes                |
| 0.3.0   | 2026-04-07   | Mobile Auth    | Mobile auth UI, password reset, email delivery, token mgmt  |
| 0.4.0   | TBD          | Recipes        | Recipe CRUD, search, ingredients, images                    |
| 1.0.0   | TBD          | Release        | Full feature set, production ready                          |

## Notes for Contributors

When updating this changelog:

1. Add changes under `[Unreleased]` section during development
2. When releasing a new version, create a new section with version and date
3. Use categories: Added, Changed, Fixed, Deprecated, Removed, Security
4. Keep entries concise and user-focused
5. Link issues/PRs when relevant: `(#123)`
