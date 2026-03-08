# Brainstorm: CI Integration for Frontend & Backend

## Problem Statement
Current CI pipelines are incomplete:
- Frontend CI: only lint + tsc, no test or build verification
- Backend CI: only build + test, no lint or Docker build check
- No caching strategy

## Agreed Solution

### Frontend CI (full pipeline)
1. **Install** — pnpm + store cache
2. **Lint** — `pnpm lint`
3. **TypeCheck** — `pnpm --filter mobile tsc --noEmit`
4. **Test** — Jest with `jest-expo` preset
5. **Build** — `expo export` (verify JS bundle compiles)

### Backend CI (full pipeline)
1. **Build + Test** — `./mvnw clean verify` (with MongoDB service)
2. **Lint** — Checkstyle Maven plugin
3. **Docker Build** — `docker build` verify (no push)

### Caching Strategy
- pnpm store via `actions/cache`
- Maven deps via `setup-java` built-in cache (already configured)
- Docker layers via `docker/build-push-action` cache

## Implementation Considerations
- Need to add `jest-expo` preset + Jest config if not present
- Need Checkstyle Maven plugin in `pom.xml` + `checkstyle.xml` config
- Docker build in CI = verify only, no registry push
- `expo export` requires `npx expo export --platform web` or similar

## Risks
- Jest setup for RN can have transform issues — need proper `jest-expo` config
- Checkstyle rules too strict = noisy CI — use Google/Sun style relaxed
- Docker build adds ~2-3min to CI time

## Success Criteria
- All 5 frontend steps pass on PR
- All 3 backend steps pass on PR
- CI total time < 10min with caching
- No false positives blocking PRs
