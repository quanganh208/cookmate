# Cookmate Development Roadmap

**Status:** Living document. Updated as phases progress.
**Last Updated:** 2026-04-07

## Phase Overview

| Phase     | Description                                                                | Status   | Target     | Dependencies |
| --------- | -------------------------------------------------------------------------- | -------- | ---------- | ------------ |
| Phase 1   | Foundation (monorepo, mobile skeleton, backend skeleton, Docker)           | Complete | 2026-03-06 | —            |
| Phase 2   | Home Screen UI (5-tab nav, home layout, components)                        | Complete | 2026-03-20 | Phase 1      |
| Phase 2.5 | Mobile Restructure (feature-based architecture, state management, offline) | Complete | 2026-03-21 | Phase 2      |
| Phase 3   | Authentication (user registration, JWT, profile)                           | Complete | 2026-03-24 | Phase 2.5    |
| Phase 3.5 | Mobile Authentication UI + Backend Password Reset                          | Complete | 2026-04-07 | Phase 3      |
| Phase 4   | Recipes (CRUD, ingredients, steps, images, search)                         | Planned  | 2026-06-30 | Phase 3.5    |
| Phase 5   | Social (follow, like, bookmark, comments, ratings)                         | Planned  | 2026-08-31 | Phase 4      |
| Phase 6   | AI Features (suggestions, nutrition, meal planning)                        | Planned  | 2026-10-31 | Phase 4, 5   |

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

### Phase 4: Recipes

- Recipe CRUD operations (create, read, update, delete)
- Ingredient list management with quantities
- Step-by-step recipe instructions
- Image upload to cloud storage (TODO: select provider)
- Full-text search by recipe name
- Filter by cuisine, difficulty, prep time

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
