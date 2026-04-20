# Phase 4.1 — Recipe Detail + Wire Format Alignment

## Context Links

- **Brainstorm**: `/Volumes/QUANGANH1TB/Coding/cookmate/plans/reports/brainstorm-260420-0945-phase-4-mobile-recipes.md`
- **Overview**: `./plan.md`
- **BE reference**: `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/recipe/`
- **Mobile reference**: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/auth/` (structure pattern)
- **Docs**: `/Volumes/QUANGANH1TB/Coding/cookmate/docs/system-architecture.md`, `/Volumes/QUANGANH1TB/Coding/cookmate/docs/code-standards.md`

## Overview

- **Priority**: P1 (blocks all other slices)
- **Status**: complete (2026-04-20)
- **Estimate**: 3–4 days
- **Description**: Align mobile types/repo/hooks with BE `ApiResponseEnvelope<Page<RecipeResponse>>` wire format. Rewrite recipe-detail-screen from mock → real API with skeleton/error states. Delete home mock data, feed home from real API. Establishes canonical pattern reused by Slices 2/3/4.

## Key Insights

- BE returns `ApiResponse<Page<RecipeResponse>>`; mobile `api-client.ts` already unwraps envelope → payload. Confirm `Page<T>` shape passes through correctly.
- Mobile `recipes-repository.ts` currently expects `Recipe[]` — wrong. Must rewrite to return `Page<Recipe>`.
- `useInfiniteQuery` pagination uses `Page.number + Page.last` for `getNextPageParam`.
- Home screen uses `mock-recipes.ts` — delete once real API wired.
- This slice establishes the canonical feature structure reused in Slices 2/3/4.

## Requirements

### Functional

- [x] Mobile `Recipe` type matches BE `RecipeResponse` (all fields: id, title, description, imageUrl, serving, prepTime, cookTime, difficulty, cuisine, status, viewCount, likeCount, isFeatured, authorId, category, steps[], ingredients[], author info, createdAt, updatedAt)
- [x] `recipes-repository.ts` exposes: `list(pageable)`, `getById(id)`, `findByCategory(category, pageable)`, `findFeatured(pageable)`, `findByAuthor(authorId, pageable)` returning `Page<Recipe>` or `Recipe`
- [x] Hooks: `useInfiniteRecipes()`, `useRecipe(id)`, `useFeaturedRecipes()`, `useRecipesByCategory(cat)`
- [x] Recipe detail screen renders: hero image, title, author, stats (views/likes), prep/cook/total time, difficulty, cuisine, ingredients list, numbered steps
- [x] Loading skeleton + error retry UI
- [x] Home feed sources real API (no mock file)

### Non-Functional

- [x] Detail screen render <500ms after data fetch on mid-tier device
- [x] `api-client` envelope unwrap covered by unit test
- [x] Screen files <200 LOC each (split into sub-components if needed)
- [x] Zero network calls in tests (MSW or axios-mock-adapter)

## Architecture

### Data Flow

```
Home screen → useInfiniteRecipes() → recipes-repository.list(pageable)
   → api-client.get('/api/recipes', {page, size}) → unwrap ApiResponse<Page<Recipe>> → Page<Recipe>
   → useInfiniteQuery cache → RecipeCardCompact list

Detail screen → useRecipe(id) → recipes-repository.getById(id)
   → api-client.get(`/api/recipes/${id}`) → unwrap ApiResponse<Recipe> → Recipe
   → Hero + Ingredients + Steps sub-components
```

### Components

- **Recipe types**: Align `features/recipes/types.ts` with BE DTOs (Recipe, Ingredient, Step, AuthorInfo, Page<T>)
- **Repository**: Thin wrapper over `api-client` returning typed payloads
- **Hooks**: TanStack Query wrappers (staleTime 5min, `keepPreviousData` on infinite)
- **Screens**: `recipe-detail-screen` + sub-components (`RecipeHero`, `RecipeIngredients`, `RecipeSteps`, `RecipeDetailSkeleton`, `ErrorView`)

## Related Code Files

### Modify

- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/types.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/api/recipes-repository.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/screens/recipe-detail-screen.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/index.ts` (exports)
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/home/screens/home-screen.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/home/components/*` (any using mock)
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/shared/api/api-client.ts` (confirm envelope unwrap; add test if missing)
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/recipe/controller/RecipeController.java` <!-- Updated: Validation Session 1 - V2 add ?view=false query param to findById --> (add `@RequestParam(defaultValue="true") boolean view` to `findById`; pass to service)
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/recipe/service/RecipeService.java` (gate `incrementViewCount` on boolean param)
- `/Volumes/QUANGANH1TB/Coding/cookmate/docs/development-roadmap.md` (Phase 4 "In Progress" + BE items "Complete")
- `/Volumes/QUANGANH1TB/Coding/cookmate/docs/project-changelog.md` (Slice 1 entry)

### Create

- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/hooks/use-recipes.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/hooks/use-recipe-detail.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/components/recipe-hero.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/components/recipe-ingredients.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/components/recipe-steps.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/components/recipe-detail-skeleton.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/shared/components/error-view.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/__tests__/recipes-repository.test.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/__tests__/use-recipes.test.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/__tests__/recipe-detail-screen.test.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/shared/api/__tests__/api-client-envelope.test.ts` (if not existing)

### Delete

- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/home/data/mock-recipes.ts` (or wherever mock lives)
- Any stale mock imports in home screen

## Implementation Steps

1. **Read BE DTOs**: Open `backend/src/main/java/com/cookmate/recipe/dto/RecipeResponse.java`, `CreateRecipeRequest.java`. Document exact field names/types.
2. **Type definitions**: Rewrite `features/recipes/types.ts` with `Recipe`, `RecipeIngredient`, `RecipeStep`, `AuthorInfo`, generic `Page<T>`.
3. **API client envelope verify**: Read `shared/api/api-client.ts`. Confirm `ApiResponseEnvelope<T>` → `T` unwrap. Add test covering success envelope + error envelope if missing.
4. **Caller inventory (BLOCKER for repo rewrite)**: Grep `recipesRepository` + `mock-recipes` across `apps/mobile/`. List every import site with current + expected new signature. Document in Todo below as explicit checklist. Blocks repo rewrite until audited — prevents silent compile breaks in unrelated screens.
5. **Component shape audit**: Audit `RecipeCardCompact` + `RecipeCardFeatured` props against new `Recipe` type (derived from BE `RecipeResponse`). Produce field map (old prop shape vs new `Recipe` shape). Fix component if shape drifts. Add fixture-based render test that mounts card with a canonical `RecipeResponse` fixture.
6. **Repository rewrite**: Implement `list`, `getById`, `findByCategory`, `findFeatured`, `findByAuthor` in `api/recipes-repository.ts`. Use query params `{page, size}` for pageable.
7. **Hooks**:
   - `use-recipes.ts`: `useInfiniteRecipes()` with `getNextPageParam: (last) => last.last ? undefined : last.number + 1`
   - Add `useFeaturedRecipes()`, `useRecipesByCategory(cat)` same pattern
   - `use-recipe-detail.ts`: `useRecipe(id)` with `useQuery`, staleTime 5min
8. **Detail screen rewrite**: Replace mock with `useRecipe(id)` hook. Render skeleton while loading, ErrorView on error with retry, Recipe content on success. Split into sub-components (hero/ingredients/steps).
9. **Home screen wire-up**: Replace mock import with `useInfiniteRecipes()`. Add pull-to-refresh + infinite scroll onEndReached.
10. **Delete mocks (sweep)**:
    - (a) Grep for literal IDs matching `mock-recipe-*` or `mock-` across entire repo (not just features/home).
    - (b) Audit `__fixtures__/` dirs + any e2e test dirs (`e2e/`, `detox/`, `__mocks__/`) for inline mock refs.
    - (c) Run `expo start --clear` to clear Metro bundler cache (stale imports can survive deletes).
    - (d) Verify via build: `pnpm mobile typecheck` + `pnpm mobile test` must pass with zero imports to deleted file.
11. **Tests**:

- Unit: `recipes-repository.test.ts` — verify `list` unwraps envelope+Page correctly via mocked api-client
- Unit: `use-recipes.test.ts` — loading/success/error states, pagination
- Smoke: `recipe-detail-screen.test.tsx` — renders skeleton → data, error retry
- Envelope: `api-client-envelope.test.ts` — unwrap `ApiResponse<T>`, propagate error

12. **Run lint + tests**: `pnpm lint`, `pnpm mobile test`, `pnpm backend:test`. Must all pass.
13. **Docs sync**: Update `docs/development-roadmap.md` (Phase 4 status + BE items Complete) + `docs/project-changelog.md` (Slice 1 entry with date).

## Todo List

- [x] Read BE DTOs & document field map
- [x] Rewrite `features/recipes/types.ts`
- [x] Verify + test api-client envelope unwrap
- [x] Caller inventory: grep `recipesRepository` + `mock-recipes` — list every import site (blocks repo rewrite)
- [x] Audit `RecipeCardCompact` + `RecipeCardFeatured` prop shapes vs new `Recipe` type; fix + add fixture render test
- [x] Rewrite `recipes-repository.ts`
- [x] Create `use-recipes.ts` + `use-recipe-detail.ts`
- [x] Split detail screen into sub-components
- [x] Rewrite `recipe-detail-screen.tsx` with real hook
- [x] Wire home screen to real API
- [x] Delete `mock-recipes.ts` + grep `mock-recipe-*` literal IDs + audit `__fixtures__/` + e2e dirs
- [x] Run `expo start --clear` to clear Metro cache; verify `pnpm mobile typecheck` + tests pass with zero stale imports
- [x] Write repository unit tests
- [x] Write hook tests
- [x] Write detail screen smoke test
- [x] Write/verify api-client envelope test
- [x] Run lint + mobile tests + backend tests (all green)
- [x] Update `docs/development-roadmap.md`
- [x] Update `docs/project-changelog.md`
- [x] Commit: `feat(mobile): wire recipe detail + align BE wire format`

## Success Criteria

- [x] Tap recipe card on home → detail shows real BE data (no mock)
- [x] Delete `mock-recipes.ts` → app still compiles + runs
- [x] Infinite scroll on home fetches subsequent pages
- [x] Skeleton → content transition visible
- [x] Error state with retry works when BE returns 500
- [x] 18/18 mobile tests + new tests pass; 61/61 backend unchanged
- [x] Lint + format clean
- [x] Roadmap + changelog updated

## Risk Assessment

| Risk                                                               | Likelihood | Impact | Mitigation                                                                                                                         |
| ------------------------------------------------------------------ | ---------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| BE `Page<T>` shape differs from assumed Spring default             | Medium     | High   | Hit `/api/recipes` from a real dev run before coding repo; snapshot response in test fixture                                       |
| Envelope unwrap regression in `api-client.ts`                      | Low        | High   | Dedicated test fixture; run auth tests to confirm no breakage                                                                      |
| Home feed layout breaks without mocks                              | Medium     | Medium | Empty-state UI + skeleton during first fetch                                                                                       |
| Large recipe objects hurt perf                                     | Low        | Low    | `FlatList` with `initialNumToRender`, memoized cards                                                                               |
| Mock file imported elsewhere (hidden)                              | Medium     | Low    | Full-repo grep after delete                                                                                                        |
| Hidden mock references in test fixtures / Metro cache              | Medium     | Medium | Grep literal IDs (`mock-recipe-*`, `mock-`) + audit `__fixtures__/` + e2e dirs + `expo start --clear` (see Implementation Step 10) |
| `RecipeCard*` component props drift from BE `RecipeResponse` shape | Medium     | Medium | Explicit prop-vs-DTO field map audit + fixture-based render test (Step 5)                                                          |

## Security Considerations

- Detail endpoint is public read; no auth check needed.
- Ensure `api-client` still attaches JWT for authed endpoints used by other flows (no regression in auth interceptor).
- No user input rendered unsafely — all data from BE; React Native escapes by default.

## Rollback Plan

- Git revert slice commit. Mock data file restoration via git history. No BE migrations → safe to revert.

## Next Steps

- Unblocks Slices 2/3/4 (all depend on canonical types + repo pattern).
- Feed the same `Page<Recipe>` shape into Search (Slice 2) and Favorites (Slice 4).
- After Slice 1 merge, announce pattern in PR description so subsequent slices reuse without drift.
