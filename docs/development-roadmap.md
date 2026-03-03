# Cookmate Development Roadmap

**Status:** Living document. Updated as phases progress.
**Last Updated:** 2026-03-06

## Phase Overview

| Phase | Description | Status | Target | Dependencies |
|-------|-------------|--------|--------|--------------|
| Phase 1 | Foundation (monorepo, mobile skeleton, backend skeleton, Docker) | Complete | 2026-03-06 | — |
| Phase 2 | Authentication (user registration, JWT, profile) | Planned | 2026-04-30 | Phase 1 |
| Phase 3 | Recipes (CRUD, ingredients, steps, images, search) | Planned | 2026-06-30 | Phase 2 |
| Phase 4 | Social (follow, like, bookmark, comments, ratings) | Planned | 2026-08-31 | Phase 3 |
| Phase 5 | AI Features (suggestions, nutrition, meal planning) | Planned | 2026-10-31 | Phase 3, 4 |

## Phase Details

### Phase 1: Foundation (Complete)
- Monorepo setup with pnpm workspaces
- React Native Expo SDK 55 mobile app skeleton
- Spring Boot 3.5.11 backend skeleton
- Docker Compose development environment (MongoDB 8.0)
- GitHub Actions CI/CD pipeline setup
- ESLint 9, Prettier, code standards documentation

### Phase 2: Authentication
- User registration with email validation
- Login with JWT token generation and refresh
- Password hashing (bcrypt) and validation
- Protected API endpoints and route guards
- Profile management (name, bio, avatar)
- Session persistence on mobile

### Phase 3: Recipes
- Recipe CRUD operations (create, read, update, delete)
- Ingredient list management with quantities
- Step-by-step recipe instructions
- Image upload to cloud storage (TODO: select provider)
- Full-text search by recipe name
- Filter by cuisine, difficulty, prep time

### Phase 4: Social
- User discovery and follow system
- Like/bookmark recipe functionality
- Public recipe feeds
- Comments and ratings on recipes
- Notification system for interactions

### Phase 5: AI Features
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
- **M2 (2026-04-30):** Authentication released to testflight/internal testing
- **M3 (2026-06-30):** Recipes beta, public MVP launch
- **M4 (2026-08-31):** Social features, 1.0 release candidate
- **M5 (2026-10-31):** AI features, 1.0 stable release

## Open Questions

- Phase 5 AI provider selection (OpenAI, Anthropic, open-source)
- Image storage solution (S3, Firebase, Cloudinary)
- Analytics and monitoring platform
