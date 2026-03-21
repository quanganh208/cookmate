# Cookmate Development Roadmap

**Status:** Living document. Updated as phases progress.
**Last Updated:** 2026-03-21

## Phase Overview

| Phase     | Description                                                                | Status   | Target     | Dependencies |
| --------- | -------------------------------------------------------------------------- | -------- | ---------- | ------------ |
| Phase 1   | Foundation (monorepo, mobile skeleton, backend skeleton, Docker)           | Complete | 2026-03-06 | —            |
| Phase 2   | Home Screen UI (5-tab nav, home layout, components)                        | Complete | 2026-03-20 | Phase 1      |
| Phase 2.5 | Mobile Restructure (feature-based architecture, state management, offline) | Complete | 2026-03-21 | Phase 2      |
| Phase 3   | Authentication (user registration, JWT, profile)                           | Planned  | 2026-04-30 | Phase 2.5    |
| Phase 4   | Recipes (CRUD, ingredients, steps, images, search)                         | Planned  | 2026-06-30 | Phase 3      |
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
- Added dependencies: zustand, @tanstack/react-query, @tanstack/react-query-persist-client, react-native-mmkv

### Phase 3: Authentication

- User registration with email validation
- Login with JWT token generation and refresh
- Password hashing (bcrypt) and validation
- Protected API endpoints and route guards
- Profile management (name, bio, avatar)
- Session persistence on mobile

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
- **M3 (2026-04-30):** Authentication released to testflight/internal testing
- **M4 (2026-06-30):** Recipes beta, public MVP launch
- **M5 (2026-08-31):** Social features, 1.0 release candidate
- **M6 (2026-10-31):** AI features, 1.0 stable release

## Open Questions

- Phase 5 AI provider selection (OpenAI, Anthropic, open-source)
- Image storage solution (S3, Firebase, Cloudinary)
- Analytics and monitoring platform
