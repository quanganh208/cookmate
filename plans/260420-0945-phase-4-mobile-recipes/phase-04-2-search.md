# Phase 4.2 — Search (BE Full-Text Endpoint + Mobile Screen)

## Context Links

- **Brainstorm**: `/Volumes/QUANGANH1TB/Coding/cookmate/plans/reports/brainstorm-260420-0945-phase-4-mobile-recipes.md`
- **Overview**: `./plan.md`
- **Slice 1 (blocker)**: `./phase-04-1-recipe-detail.md`
- **BE reference**: `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/recipe/` (Recipe has `@TextIndexed` on title + description)
- **Docs**: `/Volumes/QUANGANH1TB/Coding/cookmate/docs/system-architecture.md`

## Overview

- **Priority**: P1
- **Status**: pending (blocked by Slice 1)
- **Estimate**: 2–3 days
- **Description**: Add `GET /api/recipes/search?q=&page=&size=` using MongoDB `$text` full-text on title+description. Ship mobile search screen with debounced input, recent searches (MMKV), infinite scroll results, empty/error/loading states.

## Key Insights

- `Recipe.java` already has `@TextIndexed` on title + description. MongoDB auto-creates text index.
- Spring Data `TextCriteria` auto-escapes user input — safe from injection.
- For Vietnamese tokenization, set TextIndex `language: 'none'` (whitespace split). Fallback: `$regex` case-insensitive if `$text` returns poor results.
- MMKV already wired (Phase 2.5) — reuse for recent searches persistence.
- 300ms debounce standard for search UX.

## Requirements

### Functional

- [ ] `GET /api/recipes/search?q=<query>&page=0&size=20` returns `Page<RecipeResponse>`
- [ ] Empty/blank `q` → 400 Bad Request
- [ ] Mobile search screen: text input + X clear button
- [ ] Debounced query (300ms) triggers `useInfiniteQuery`
- [ ] State machine: idle (recent searches) → loading → results-grid OR empty-results OR error
- [ ] Recent searches: last 10 queries persisted in MMKV; tap to re-run; clear-all button
- [ ] Results grid reuses `RecipeCardCompact`; infinite scroll same pattern as home

### Non-Functional

- [ ] Search response <500ms on dev MongoDB with seeded data
- [ ] Debounce correctly cancels in-flight stale queries (TanStack Query `keepPreviousData`)
- [ ] No regression: 61/61 backend tests + 18/18 + new mobile tests

## Architecture

### Data Flow

```
User types → TextInput onChangeText
  → useDebouncedValue(query, 300ms)
  → useRecipesSearch(debouncedQuery) — enabled: q.trim().length > 0
  → search-repository.search(q, pageable)
  → api-client.get('/api/recipes/search', {q, page, size})
  → BE RecipeController.search → RecipeService.searchByText
  → RecipeRepository.findByTextCriteria(TextCriteria.forLanguage("none").matching(q), pageable)
  → MongoDB $text query
  → ApiResponse<Page<RecipeResponse>> → unwrap → Page<Recipe>
  → useInfiniteQuery cache → grid
```

### Components

- **BE**: `RecipeController.search`, `RecipeService.searchByText`, `RecipeRepository.findByTextCriteria`
- **Mobile**: `SearchScreen`, `SearchBar` (reuse from home), `RecentSearchesList`, `SearchResultsGrid`, hooks `useRecipesSearch`, `useRecentSearches`, `useDebouncedValue`

## Related Code Files

### Modify

- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/recipe/controller/RecipeController.java`
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/recipe/service/RecipeService.java`
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/recipe/repository/RecipeRepository.java`
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/recipe/model/Recipe.java` (verify `@TextIndexed language = "none"`; adjust if needed)
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/search/screens/search-screen.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/search/index.ts`

### Create

- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/recipe/repository/RecipeRepositoryCustom.java`
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/recipe/repository/RecipeRepositoryCustomImpl.java`
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/shared/migration/MongoIndexMigration.java`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/search/api/search-repository.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/search/hooks/use-recipes-search.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/search/hooks/use-recent-searches.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/shared/hooks/use-debounced-value.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/search/components/recent-searches-list.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/search/components/search-results-grid.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/search/components/search-empty-state.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/search/__tests__/search-repository.test.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/search/__tests__/use-debounced-value.test.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/search/__tests__/use-recent-searches.test.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/search/__tests__/search-screen.test.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/test/java/com/cookmate/recipe/RecipeSearchIntegrationTest.java`

### Delete

- None

## Prerequisites

- **CI Docker verification** (BLOCKS Slice 2 integration tests): Read `.github/workflows/backend-ci.yml`. Confirm Mongo availability in test runs — check for Flapdoodle embedded Mongo, docker-compose service, or Testcontainers setup. If embedded Mongo in use, document Testcontainers coexistence strategy (separate profiles, port conflicts). If no Docker setup for integration tests, add `setup-docker` + image pre-pull as prerequisite commits BEFORE authoring `RecipeSearchIntegrationTest`. Record findings in `plans/.../reports/researcher-ci-docker.md`.
- **Bucket4j dependency verification** <!-- Updated: Validation Session 1 - V4 --> (BLOCKS rate-limit implementation): Read `backend/pom.xml`. If `com.bucket4j:bucket4j-core` NOT present, add as dependency in a dedicated commit BEFORE implementing search rate limit. If Phase 3.5 password-reset rate limit used an in-memory map instead of Bucket4j, decide: keep same pattern for consistency, or migrate both to Bucket4j. Document choice in phase file.

## Implementation Steps

1. **BE — Custom Repository for text query**: Create `RecipeRepositoryCustom` interface + `RecipeRepositoryCustomImpl` using injected `MongoTemplate` (Spring Data derived queries don't support `TextQuery.sortByScore()`). Implement `Page<Recipe> searchByText(String q, Pageable pageable)`:
   ```java
   TextCriteria criteria = TextCriteria.forLanguage("none").matching(q);
   Query query = TextQuery.queryText(criteria).sortByScore().with(pageable);
   List<Recipe> hits = mongoTemplate.find(query, Recipe.class);
   long total = mongoTemplate.count(Query.of(query).limit(-1).skip(-1), Recipe.class);
   return new PageImpl<>(hits, pageable, total);
   ```
   Declare `RecipeRepository extends MongoRepository<Recipe,String>, RecipeRepositoryCustom`. Add `RecipeRepositoryCustom.java` + `RecipeRepositoryCustomImpl.java` to Files to Create below.
2. **BE — Service**: `searchByText(String q, Pageable p)` — validate `q` not blank (throw `BadRequestException`), delegate to `recipeRepository.searchByText(q, p)`, map `Page<Recipe>` → `Page<RecipeResponse>`.
3. **BE — Controller**: `@GetMapping("/search")` public endpoint (no auth required for browse), `@RequestParam @NotBlank @Size(min=1, max=200) String q`, `Pageable pageable`, wrap with `ApiResponse`.
4. **BE — Recipe.java + Index Migration**: Verify `@TextIndexed(language = "none")` on title + description. Create `MongoIndexMigration` `@Component` with `@PostConstruct` that reads `MongoTemplate.indexOps("recipes").getIndexInfo()`. If existing text index language != `"none"`, drop it and let Spring Data recreate via annotation. Idempotent (safe on rolling restart). Log migration action at INFO level. Add `backend/src/main/java/com/cookmate/shared/migration/MongoIndexMigration.java` to Files to Create.
5. **BE — Integration test**: `RecipeSearchIntegrationTest`:
   - Seed recipes (e.g. "Phở bò", "Bún chả", "Pizza")
   - Search "pho" → returns recipe containing "Phở"
   - Empty `q` → 400
   - Pagination honored
6. **Mobile — Debounce hook**: Generic `useDebouncedValue<T>(value, delay)` in `shared/hooks/`.
7. **Mobile — Repository**: `search-repository.ts` → `search(q, pageable)` returning `Page<Recipe>`.
8. **Mobile — Recent searches hook**: `useRecentSearches()` with MMKV:
   - **Key format**: `search.recent.${userId}` (scoped per user — prevents leak across account switch).
   - **Read path**: wrap in try/catch; return `[]` on corruption/parse error; log once at warn level.
   - **Encryption**: MMKV instance configured with `cryptKey` derived from device keystore via `expo-secure-store` (no plaintext search history at rest).
   - **Logout hook**: subscribe to `auth-events.logout` event; clear the per-user key on logout.
   - **Cap/dedup**: max 10 entries, newest-first, dedup case-insensitive (normalize via `toLocaleLowerCase` before compare).
   - **Backup guard**: document in app.json that `android:allowBackup=false` is required so MMKV file is not auto-backed up to Google Drive (add comment pointer in app.json if flag missing).
9. **Mobile — Search hook**: `useRecipesSearch(q)` using `useInfiniteQuery`, `enabled: q.trim().length > 0`, `keepPreviousData: true`, `queryKey: ['recipes', 'search', q]`.
10. **Mobile — UI**:
    - `SearchScreen`: header SearchBar + body (state machine)
    - Idle (empty q): `RecentSearchesList` with clear-all
    - Loading: skeleton grid
    - Error: reuse `ErrorView` from Slice 1
    - Empty results: `SearchEmptyState`
    - Success: `SearchResultsGrid` with `RecipeCardCompact` + infinite scroll
11. **Mobile — Tests**:
    - `use-debounced-value.test.ts` — timer-based with jest fake timers
    - `use-recent-searches.test.ts` — MMKV mock, add/remove/clear/dedupe
    - `search-repository.test.ts` — mock api-client, verify query params
    - `search-screen.test.tsx` — smoke: idle → typed query → results state
12. **Run all tests + lint**: `pnpm backend:test`, `pnpm mobile test`, `pnpm lint`.

## Todo List

- [ ] Prereq: verify CI Docker/Mongo setup for integration tests; add setup commits if missing
- [ ] BE: `RecipeRepositoryCustom` + `RecipeRepositoryCustomImpl` with `MongoTemplate.find` + `TextQuery.sortByScore()`
- [ ] BE: `RecipeRepository extends MongoRepository, RecipeRepositoryCustom`
- [ ] BE: `MongoIndexMigration` `@PostConstruct` — drop stale text index if language mismatch
- [ ] BE: `RecipeService.searchByText` with blank-q validation
- [ ] BE: `RecipeController.search` endpoint with `@NotBlank @Size(1,200)` on q
- [ ] BE: Pageable max-size cap (50) via resolver
- [ ] BE: Bucket4j 60 req/min rate limit on `/search`
- [ ] BE: verify Recipe `@TextIndexed(language = "none")`
- [ ] BE: `RecipeSearchIntegrationTest` (happy, empty, pagination, oversize page rejected, rate-limit)
- [ ] Mobile: `use-debounced-value.ts` + test
- [ ] Mobile: `search-repository.ts` + test
- [ ] Mobile: `use-recent-searches.ts` + test (MMKV) — per-user key, keystore-derived cryptKey, logout clear, corruption-safe read
- [ ] Mobile: `use-recipes-search.ts` (infinite query)
- [ ] Mobile: `RecentSearchesList` component
- [ ] Mobile: `SearchResultsGrid` component
- [ ] Mobile: `SearchEmptyState` component
- [ ] Mobile: rewrite `search-screen.tsx`
- [ ] Mobile: `search-screen.test.tsx` smoke
- [ ] Lint + tests all green
- [ ] Commit: `feat(search): add full-text recipe search BE + mobile screen`

## Success Criteria

- [ ] Type "pho" → results include "Phở" within 500ms of settled debounce
- [ ] Empty q → shows recent searches; tap recent → re-run
- [ ] No results → empty state shown
- [ ] Offline → error state with retry
- [ ] Recent searches persist across app restart
- [ ] 61 BE + new search test pass; 18 mobile + new tests pass
- [ ] Lint clean

## Risk Assessment

| Risk                                                      | Likelihood | Impact | Mitigation                                                                                |
| --------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------- |
| `$text` misses Vietnamese diacritics                      | Medium     | Medium | `language: "none"` + optional regex fallback; test with Vietnamese fixtures               |
| Text index collision with existing index (wrong language) | Medium     | Medium | Document drop-and-recreate step for dev Mongo; CI fresh container                         |
| Debounce race / stale results                             | Low        | Medium | `keepPreviousData` + query key includes `q`; TanStack auto-cancels                        |
| MMKV storage bloat if user spams                          | Low        | Low    | Cap list at 10, dedupe                                                                    |
| Search endpoint abused (scraping)                         | Medium     | Medium | Bucket4j 60 req/min; @Size cap on q; Pageable size cap 50                                 |
| Derived query can't sort by text score                    | High       | High   | Use `MongoTemplate` + `TextQuery.sortByScore()` via `RecipeRepositoryCustom` (see Step 1) |
| Stale text index (wrong language) from prior dev          | Medium     | High   | `MongoIndexMigration` drops+recreates idempotently on boot (Step 4)                       |
| CI Mongo container missing → integration tests fail       | Medium     | High   | Prerequisites step verifies CI workflow before authoring tests                            |
| MMKV recent searches leak across user accounts            | Medium     | Medium | Per-user key `search.recent.${userId}` + logout clear                                     |
| MMKV file backed up via Android auto-backup               | Low        | Medium | `android:allowBackup=false` + keystore-derived cryptKey                                   |

## Security Considerations

- Endpoint public (browse); no JWT required. Double-check `SecurityConfig` permit list includes `/api/recipes/search`.
- Spring Data `TextCriteria.matching(q)` auto-escapes — never concat `q` into raw BSON.
- **MANDATORY input validation**: `@NotBlank` + `@Size(min=1, max=200)` on `q`.
- **Pageable cap**: global `@PageableDefault(size=20)` with enforced max via custom `PageableHandlerMethodArgumentResolver` (cap `size` at 50). Prevents `?size=10000` DoS.
- **Rate limit**: minimal 60 req/min/user via Bucket4j (reuse pattern from upload/password-reset). Public endpoint → key by IP when unauth'd; by userId when auth'd.
- **Regex fallback note** (if ever added for Vietnamese diacritics): use `Pattern.quote(q)` to prevent regex injection + `maxTimeMS(500)` on Mongo query to bound CPU.
- Recent searches stored local only (MMKV); encrypted via keystore-derived `cryptKey` (see Step 8); cleared on logout.

## Rollback Plan

- Revert BE commit → search endpoint gone, index harmless (leave it).
- Revert mobile commit → search screen back to stub.
- No data migrations; safe.

## Next Steps

- Independent of Slices 3/4 (different files, no shared state).
- Could run parallel with Slice 3 if developer bandwidth allows, but Slice 3 is heavier so sequential recommended.
