# Cookmate Development Roadmap

**Status:** Living document. Updated as phases progress.
**Last Updated:** 2026-04-20

## Phase Overview

| Phase     | Description                                                                | Status      | Target     | Dependencies |
| --------- | -------------------------------------------------------------------------- | ----------- | ---------- | ------------ |
| Phase 1   | Foundation (monorepo, mobile skeleton, backend skeleton, Docker)           | Complete    | 2026-03-06 | —            |
| Phase 2   | Home Screen UI (5-tab nav, home layout, components)                        | Complete    | 2026-03-20 | Phase 1      |
| Phase 2.5 | Mobile Restructure (feature-based architecture, state management, offline) | Complete    | 2026-03-21 | Phase 2      |
| Phase 3   | Authentication (user registration, JWT, profile)                           | Complete    | 2026-03-24 | Phase 2.5    |
| Phase 3.5 | Mobile Authentication UI + Backend Password Reset                          | Complete    | 2026-04-07 | Phase 3      |
| Phase 4   | Recipes (CRUD, ingredients, steps, images, search)                         | In Progress | 2026-06-30 | Phase 3.5    |
| Phase 5   | Social (follow, like, bookmark, comments, ratings)                         | Planned     | 2026-08-31 | Phase 4      |
| Phase 6   | AI Features (suggestions, nutrition, meal planning)                        | Planned     | 2026-10-31 | Phase 4, 5   |

## Phase Details

### Phase 1: Foundation (Complete)

- Monorepo setup with pnpm workspaces
- React Native Expo SDK 55 mobile app skeleton
- Spring Boot 4.0.3 backend skeleton
- Docker Compose development environment (MongoDB 8.0)
- GitHub Actions CI/CD pipeline setup
- ESLint 9, Prettier, code standards documentation

### Phase 2: Home Screen UI (Complete)

- 5-tab bottom navigation (Home, Search, Create, Saved, Profile) via Expo Router
- Home screen layout: header, search bar, category filters, featured carousel, trending section
- Recipe feed: mixed layout (featured full-width card + 2-col grid)
- 7 reusable components (<200 lines each): HomeHeader, SearchBar, CategoryChips, FeaturedCarousel, TrendingSection, RecipeCardFeatured, RecipeCardCompact
- Recipe detail screen with mock data display
- 15 mock recipes covering multiple categories
- Brand colors: primary #FF7A3D, secondary #8B6914

### Phase 2.5: Mobile Restructure (Complete)

- Migrated from flat structure to feature-based modular architecture
- 6 core features (home, recipes, search, favorites, create-recipe, profile) + shared utilities
- State management: Zustand for UI state, TanStack React Query for server state
- Offline-first architecture: MMKV storage + TanStack Query sync persister
- Repository pattern for API abstraction (recipes-repository)
- Route files reduced to 2-line wrappers (no business logic)
- Path aliases (@/_ → ./_) for clean imports

### Phase 3: Authentication (Complete)

**Backend:**

- User registration with email validation (`POST /api/auth/register`)
- Email/password login with JWT token generation (`POST /api/auth/login`)
- Google OAuth2 integration (`POST /api/auth/google`)
- Token refresh with automatic rotation (`POST /api/auth/refresh`)
- Logout with refresh token revocation (`POST /api/auth/logout`)
- Current user profile endpoint (`GET /api/auth/me`)
- Password hashing with BCrypt (strength 12)
- Two-tier authentication: API Key filter + JWT filter
- Refresh tokens stored in MongoDB with 30-day TTL + auto-cleanup
- Global exception handler with standardized error responses
- Spring Security filter chain configured
- User model with email uniqueness, OAuth provider tracking
- Role-based access control (RBAC) with USER/ADMIN roles

### Phase 3.5: Mobile Authentication + Backend Password Reset (Complete)

**Backend:**

- Password reset endpoints: `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- PasswordResetService with SHA-256 token hashing, 15-minute TTL, one-time used flag
- EmailService with async Gmail SMTP delivery, HTML email templates
- PasswordResetToken model with MongoDB TTL index
- In-memory rate limiting (3 requests per hour per email, lowercase-normalized)
- Password reset success revokes all user refresh tokens (force re-login everywhere)
- AuthException refactor: semantic error codes (RESET_TOKEN_INVALID, RESET_TOKEN_EXPIRED, RESET_RATE_LIMITED)
- Wire-format change: error.code field now semantic instead of HTTP status name

**Mobile:**

- Auth feature module with 8 endpoints (login, register, google, refresh, me, logout, forgot-password, reset-password)
- Zustand auth store with session state + bootstrap status
- Login/register screens with Zod form validation + react-hook-form
- Forgot/reset password screens with email + token validation flows
- Google Sign-In integration with native credentials
- 8 auth components: AuthFormField, AuthSubmitButton, AuthHeader, AuthErrorBanner, GoogleSignInButton, LoginPromptCard, AuthGate, AuthFooterLink
- Auth repository abstraction (8 endpoints via api-client)
- Token storage: access token in memory + SecureStore, refresh token SecureStore-only
- SecureToken storage wrapper for expo-secure-store (Keychain on iOS, Keystore on Android)
- Single-flight 401 refresh interceptor with auto-retry
- Automatic logout on refresh token expiration + auth:logout event
- protected route guards via AuthGate wrapper + useRequireAuth hook
- Root layout bootstrap: hydrate session from SecureStore, call /auth/me, gate render on completion
- Feature gating: Favorites/Create screens + Profile login prompt
- Deep link support: `cookmate://reset?token=xxx` route handling
- Error mapper: backend error codes → English user messages
- 18/18 mobile tests passing; 61/61 backend tests passing

### Phase 4: Recipes (In Progress)

4 vertical slices wiring the mobile app to live BE recipe endpoints, adding missing BE endpoints
(`/api/recipes/search`, `/api/uploads/image`, favorites helpers), and deleting all mobile mock data.

**Slice 4.1 — Recipe Detail + wire format (Complete):**

- Mobile `Recipe` type extended to match BE `RecipeResponse` (20 fields incl. viewCount, serving,
  prepTime, cuisine, status, authorId, updatedAt, steps[], ingredients[], nested author)
- `Page<T>` generic added to mobile shared types mirroring Spring Data Page
- `recipes-repository.ts` rewritten: `list`/`findByCategory`/`findFeatured`/`findByAuthor` return
  `Page<Recipe>`; `getById(id, { view })` supports the new `?view` gate
- Hooks: `useInfiniteRecipes`, `useFeaturedRecipes`, `useRecipesByCategory` (TanStack
  `useInfiniteQuery` with `getNextPageParam` driven by `.last`/`.number`); `useRecipe` for detail
- Recipe detail screen rewritten: `RecipeHero` + `RecipeIngredients` + `RecipeSteps` sub-components,
  `RecipeDetailSkeleton` loading state, shared `ErrorView` with retry
- Home screen wired to live API with pull-to-refresh + onEndReached pagination + empty/error states
- Backend: `GET /api/recipes/{id}` adds `?view` query param (default `true` for backward compat);
  `view=false` skips `incrementViewCount`
- All mock data deleted: `shared/constants/mock-recipes.ts` + re-export removed
- 28/28 mobile tests passing (18 existing + 10 new); 63/63 backend tests passing (61 existing + 2 new)
- Branch: `feat/phase-4-1-recipe-detail`

**Slice 4.4 — Favorites (Complete):**

- BE: Collection model gains `isSystem` flag + compound unique index `(authorId, name)` to prevent
  race-created duplicates
- `CollectionService.getOrCreateFavorites` uses atomic `findAndModify` upsert with `$setOnInsert`;
  legacy non-system "Favorites" rows self-heal to `isSystem=true` on read
- Unicode-aware reserved-name guard (NFKC + `\p{C}` strip + `Locale.ROOT` lowercase) rejects
  "Favorites"/"FAVORITES"/" Favourites "/"Fav\u200Borites"/"yêu thích"
- Delete guard on `isSystem=true` collections (400); `CollectionRequest` DTO omits `isSystem`
- 5 new endpoints (all JWT-gated via SecurityConfig): `GET /favorites`, `GET /favorites/recipes`
  (paginated, visibility-filtered, view-count-safe), `POST /favorites/recipes`,
  `DELETE /favorites/recipes/{id}`, `GET /favorites/contains/{id}`
- `RecipeRepositoryCustom.findAllByIdInForFavorites` — single batch Mongo query filtered to
  PUBLISHED + viewer's own drafts (same enumeration-oracle rule as the add endpoint)
- `FavoritesRateLimiter` (60 req/min/user) via the shared sliding-window helper from Slice 4.2
- Mobile: `favoritesRepository`, `useFavorites` (infinite scroll), `useIsSaved`, `useToggleSave`
  (optimistic `onMutate` + `onError` rollback + `onSettled` invalidate)
- `SaveButton` heart toggle wired onto the detail screen header (only when authenticated)
- `FavoritesScreen` rewritten: grid + empty state + error retry + pagination
- 16 new BE integration tests (auto-create, idempotency, delete guard, all reserved-name variants,
  DTO spoof, concurrent-race, enumeration oracle, cross-user isolation, 429 rate limit)
- 48/48 mobile tests passing (43 → 48); 85/85 backend tests passing (69 → 85)
- Branch: `feat/phase-4-4-favorites`

**Slice 4.3 — Create Recipe + R2 Upload (Deferred):**

Blocked on manual Cloudflare R2 prerequisites (bucket provisioning, API token, public domain,
GHA secrets). All other Phase 4 slices ship without waiting.

**Slice 4.2 — Search (Complete):**

- BE: `GET /api/recipes/search?q=&page=&size=` returns `Page<RecipeResponse>` sorted by text score
- `RecipeRepositoryCustom` + `Impl` uses `MongoTemplate` + `TextQuery.sortByScore()` (Spring Data
  derived queries can't express this)
- `MongoIndexMigration` @PostConstruct drops stale text index if default_language differs from
  `"none"` and recreates with `language:"none"` to support Vietnamese + mixed-locale titles
- `SlidingWindowRateLimiter` (in-memory, ConcurrentHashMap+Deque) — same pattern as Phase 3.5
  password-reset; 60 req/min/user (or IP when anon) on `/search`
- Global `PageableHandlerMethodArgumentResolver` caps `size` at 50
- `GlobalExceptionHandler` now handles `IllegalArgumentException` + `ConstraintViolationException`
  → 400, `RateLimitedException` → 429
- Mobile: debounced (300ms) search screen with state machine (idle/loading/error/empty/results),
  `useInfiniteQuery` with `enabled: q.trim().length > 0`, recent searches in MMKV (per-user key
  `search.recent.${userId}`, cap 10, case-insensitive dedup, corruption-safe read, auto-cleared
  on logout)
- `app.config.js`: `android.allowBackup=false` (prevents MMKV backup to Google Drive)
- 43/43 mobile tests (31 previous + 12 new), 69/69 backend tests (63 previous + 6 new)
- Branch: `feat/phase-4-2-search`

_(See Slice 4.3 / 4.4 sections above for final status.)_

### Phase 5: Social

- User discovery and follow system
- Like/bookmark recipe functionality
- Public recipe feeds
- Comments and ratings on recipes
- Notification system for interactions

### Phase 6: AI Features

- Recipe suggestions based on available ingredients
- Nutritional analysis and macros calculation
- Smart meal planning (weekly plans)
- Dietary preference recommendations
- Integration with recipe generation API (TODO: select provider)

## Success Metrics

- **Performance:** API responses p95 < 200ms, p99 < 500ms
- **Availability:** 99.9% uptime target
- **Scalability:** Support 10K concurrent users
- **Security:** OWASP top 10 compliance, no critical vulnerabilities
- **Mobile:** App size < 100MB, cold start < 3s
- **Code Quality:** >80% test coverage, <5% code duplication

## Key Milestones

- **M1 (2026-03-06):** Foundation complete, project documented
- **M2 (2026-03-20):** Home screen UI complete, 5-tab navigation ready
- **M3 (2026-03-24):** Authentication backend complete, JWT + OAuth ready
- **M4 (2026-06-30):** Recipes beta, public MVP launch
- **M5 (2026-08-31):** Social features, 1.0 release candidate
- **M6 (2026-10-31):** AI features, 1.0 stable release

## Open Questions

- Phase 4: Image storage solution (S3, Firebase, Cloudinary)
- Phase 5: Analytics and monitoring platform
- Phase 6: AI provider selection (OpenAI, Anthropic, open-source)
