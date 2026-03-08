# Phase 03: Caching Strategy

## Context Links
- Frontend workflow: `.github/workflows/frontend-ci.yml`
- Backend workflow: `.github/workflows/backend-ci.yml`

## Overview
- **Priority:** Medium
- **Status:** Complete
- **Description:** Add caching for pnpm store, Maven deps, and Docker layers to speed up CI

## Key Insights
- pnpm has official `actions/cache` pattern with store path
- Maven caching already partially configured via `setup-java cache: maven`
- Docker layer caching via `docker/build-push-action` with GitHub Actions cache backend

## Requirements

### Functional
- pnpm store cached between CI runs
- Docker layers cached to avoid full rebuilds
- Cache invalidated on lockfile/pom.xml changes

### Non-functional
- CI time reduced by 30-50% on cache hits
- Cache key strategy prevents stale caches

## Related Code Files

### Modify
- `.github/workflows/frontend-ci.yml` — add pnpm cache
- `.github/workflows/backend-ci.yml` — add Docker cache

## Implementation Steps

1. Update frontend CI — add pnpm cache to `actions/setup-node`:
   ```yaml
   - name: Setup pnpm
     uses: pnpm/action-setup@v4

   - name: Setup Node.js
     uses: actions/setup-node@v4
     with:
       node-version: '22'
       cache: 'pnpm'
   ```
   Note: `actions/setup-node` has built-in pnpm cache support — just set `cache: 'pnpm'` and ensure pnpm is installed BEFORE setup-node.

2. Update backend CI — Docker build with cache:
   ```yaml
   - name: Set up Docker Buildx
     uses: docker/setup-buildx-action@v3

   - name: Build Docker image (with cache)
     uses: docker/build-push-action@v6
     with:
       context: ./backend
       file: docker/Dockerfile.backend
       push: false
       cache-from: type=gha
       cache-to: type=gha,mode=max
   ```

3. Backend Maven cache — already configured via `setup-java` with `cache: maven`. Verify `cache-dependency-path: backend/pom.xml` is set.

## Todo List
- [x] Reorder frontend CI: pnpm setup before node setup
- [x] Add `cache: 'pnpm'` to setup-node
- [x] Add Docker Buildx + build-push-action with GHA cache
- [x] Verify Maven cache works (already configured)
- [x] Test cache hit/miss in CI runs

## Success Criteria
- Second CI run shows cache hits in logs
- Frontend install step < 30s on cache hit
- Docker build step < 1min on cache hit

## Risk Assessment
- **Cache key collision:** Low risk — lockfile-based keys are standard
- **GHA cache size limit:** 10GB per repo — monitor if many branches
- **pnpm setup order:** Must install pnpm BEFORE setup-node for cache to work

## Next Steps
- Monitor CI times after caching is enabled
- Consider adding cache for Expo prebuild if native builds added later
