# Cookmate Changelog

All notable changes to the Cookmate project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Phase 2: User authentication and profile management
- Phase 3: Recipe CRUD and social features
- Phase 4: Advanced social features (followers, ratings)
- Phase 5: AI-powered recipe suggestions

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
- **Backend API:** Spring Boot 3.5.11 REST API with Java 21 LTS
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
  - Spring Boot 3.5.11 (upgraded from 3.4)
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

| Version | Release Date | Phase | Highlights |
|---------|--------------|-------|------------|
| 0.1.0 | 2026-03-06 | Foundation | Monorepo, mobile + backend scaffolds, Docker dev env |
| 0.1.1 | 2026-03-06 | CI Integration | Jest tests, Checkstyle, Docker build, multi-stage caching |
| 0.2.0 | TBD | Auth | User registration, JWT, profile management |
| 0.3.0 | TBD | Recipes | Recipe CRUD, search, ingredients, images |
| 1.0.0 | TBD | Release | Full feature set, production ready |

## Notes for Contributors

When updating this changelog:
1. Add changes under `[Unreleased]` section during development
2. When releasing a new version, create a new section with version and date
3. Use categories: Added, Changed, Fixed, Deprecated, Removed, Security
4. Keep entries concise and user-focused
5. Link issues/PRs when relevant: `(#123)`
