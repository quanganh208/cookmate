# Phase 4.4 — Favorites (Collection-Based)

## Context Links

- **Brainstorm**: `/Volumes/QUANGANH1TB/Coding/cookmate/plans/reports/brainstorm-260420-0945-phase-4-mobile-recipes.md`
- **Overview**: `./plan.md`
- **Slice 1 (blocker)**: `./phase-04-1-recipe-detail.md`
- **BE reference**: `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/collection/`
- **Docs**: `/Volumes/QUANGANH1TB/Coding/cookmate/docs/system-architecture.md`

## Overview

- **Priority**: P1
- **Status**: pending (blocked by Slice 1)
- **Estimate**: 3–4 days
- **Description**: Reuse existing `Collection` model for favorites via auto-created system Collection named "Favorites" per user. Add BE helper endpoints (`/api/collections/favorites/*`). Ship mobile Favorites screen (grid, infinite scroll) + save-button on detail with optimistic toggle.

## Key Insights

- `Collection` model + `CollectionEntry` already exist with add/remove logic — reuse instead of new `FavoriteEntry` model.
- Favorites = Collection with `name = "Favorites"` + `authorId = currentUser`. Add `isSystem: boolean` field to flag and block user-created name collisions.
- Lazy auto-create on first save: `getOrCreateFavorites(userId)`.
- Optimistic UI: toggle save button → update React Query cache immediately → rollback on error.
- `/contains/{recipeId}` check lets detail screen show correct heart state without refetching full collection.

## Requirements

### Functional

**BE**

- [ ] `Collection.java` add `isSystem: boolean` field (default false) + `@CompoundIndex(authorId+name, unique=true)`
- [ ] `CollectionService.getOrCreateFavorites(userId)` — atomic `findAndModify` upsert with `$setOnInsert`
- [ ] Block user from creating collection named "Favorites" (Unicode NFKC + strip control/zero-width + locale-root lowercase + multilingual reserved set)
- [ ] Delete guard: `isSystem=true` collections cannot be deleted (400)
- [ ] DTO guard: `CollectionRequest` never exposes `isSystem` to client (server-set only)
- [ ] Legacy self-heal: existing "Favorites" with `isSystem=false` upgraded on read
- [ ] Endpoints (all JWT required):
  - `GET /api/collections/favorites` → Collection metadata (auto-create if missing)
  - **`GET /api/collections/favorites/recipes?page=&size=`** → `Page<RecipeResponse>` (replaces N+1; no view-count side-effect)
  - `POST /api/collections/favorites/recipes` body `{recipeId}` → Collection (idempotent; rate-limited 60/min)
  - `DELETE /api/collections/favorites/recipes/{recipeId}` → 204 (idempotent; rate-limited 60/min)
  - `GET /api/collections/favorites/contains/{recipeId}` → `{saved: boolean}`
- [ ] Recipe visibility check on add-recipe (PUBLISHED-or-own-draft); uniform 404 to prevent enumeration oracle
- [ ] Author ownership enforced — user only mutates own favorites

**Mobile**

- [ ] `FavoritesScreen`: grid of `RecipeCardCompact`, infinite scroll, empty state ("No saved recipes yet"), loading skeleton
- [ ] `SaveButton` on `RecipeDetailScreen`: heart icon, toggles save/unsave
- [ ] Optimistic toggle via React Query `onMutate` + `onError` rollback
- [ ] `FavoritesScreen` query invalidated on save/unsave

### Non-Functional

- [ ] Save button feels instant (optimistic <50ms visual update)
- [ ] No N+1 fetch on favorites screen — single BE call returns Collection with populated recipes
- [ ] Save/unsave idempotent (repeated calls OK)
- [ ] No regression: BE 61 + new ≥5 tests pass; mobile 18 + new ≥4 pass

## Architecture

### Data Flow

```
First save:
  Mobile tap heart → useToggleSave.mutate(recipeId)
    → optimistic: setQueryData(['favorites', 'contains', recipeId], {saved: true})
    → favorites-repository.addRecipe(recipeId)
    → POST /api/collections/favorites/recipes {recipeId}
    → BE CollectionService.getOrCreateFavorites(userId)
      → if not exists: create {name:"Favorites", isSystem:true, authorId:userId}
    → CollectionService.addRecipe(favCollection.id, recipeId)
    → returns Collection
    → onSuccess: invalidate ['favorites']
    → onError: rollback cache

Favorites list (single-roundtrip, no N+1):
  FavoritesScreen mount → useFavorites() useInfiniteQuery
    → GET /api/collections/favorites/recipes?page=0&size=20
    → BE getOrCreateFavorites(userId) → findAllByIdIn(entries, pageable) OR $lookup aggregation
    → Page<RecipeResponse> (PUBLISHED + own DRAFT only; viewCount NOT incremented)
    → grid render (infinite scroll on endReached)
```

### Components

- **BE**: extend `CollectionController`, `CollectionService`, `Collection` model
- **Mobile feature**: `apps/mobile/features/favorites/` with api/hooks/screens/components + reusable `SaveButton` in `features/recipes/components/`

## Related Code Files

### Modify

- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/collection/model/Collection.java` (add `isSystem`)
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/collection/service/CollectionService.java` (add `getOrCreateFavorites`, reject reserved name)
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/collection/controller/CollectionController.java` (add 4 favorites endpoints)
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/collection/dto/*` (add `ContainsResponse` if needed, `AddRecipeRequest`)
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/favorites/screens/favorites-screen.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/favorites/index.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/screens/recipe-detail-screen.tsx` (add SaveButton to header)

### Create

**Backend**

- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/collection/dto/ContainsResponse.java`
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/test/java/com/cookmate/collection/FavoritesIntegrationTest.java`

**Mobile**

- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/favorites/api/favorites-repository.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/favorites/hooks/use-favorites.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/favorites/hooks/use-is-saved.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/favorites/hooks/use-toggle-save.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/favorites/components/favorites-empty-state.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/components/save-button.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/favorites/__tests__/favorites-repository.test.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/favorites/__tests__/use-toggle-save.test.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/favorites/__tests__/favorites-screen.test.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/__tests__/save-button.test.tsx`

### Delete

- None

## Implementation Steps

### Part A — BE Model + Service (0.5 day)

1. Add `isSystem: boolean` to `Collection` with `@Builder.Default false`. No migration needed (MongoDB absent field = false).
   - **Add `@CompoundIndex(name = "author_name_unique", def = "{'authorId': 1, 'name': 1}", unique = true)`** on `Collection` — prevents race-created duplicate Favorites for same user.
   - **Migration note**: before deploying the unique index, run a one-shot aggregation check for existing duplicate `(authorId, name)` pairs: `db.collections.aggregate([{$group:{_id:{authorId:'$authorId',name:'$name'},count:{$sum:1}}},{$match:{count:{$gt:1}}}])`. Fail loudly in ops log if duplicates exist; document manual dedup procedure (keep oldest, move entries to surviving doc, delete others).
2. **`CollectionService.getOrCreateFavorites(String userId)`** — atomic upsert via findAndModify:
   ```java
   return mongoTemplate.findAndModify(
     Query.query(Criteria.where("authorId").is(userId).and("name").is("Favorites")),
     new Update()
       .setOnInsert("name", "Favorites")
       .setOnInsert("authorId", userId)
       .setOnInsert("isSystem", true)
       .setOnInsert("createdAt", Instant.now()),
     FindAndModifyOptions.options().returnNew(true).upsert(true),
     Collection.class);
   ```
   Atomic (no TOCTOU race). Unique index is the final safety net.
   - **Legacy data backfill**: on read, if existing Favorites has `isSystem != true`, atomically set `{$set: {isSystem: true}}`. Document as one-time self-healing.
3. **Reserved-name check** in `CollectionService.create` — Unicode-aware (replaces naive `equalsIgnoreCase`):
   ```java
   String normalized = Normalizer.normalize(request.getName(), Normalizer.Form.NFKC)
       .replaceAll("\\p{C}", "")  // strip zero-width + control chars (prevents "Fav\u200Borites" bypass)
       .trim()
       .toLowerCase(Locale.ROOT);
   Set<String> reserved = Set.of("favorites", "favourites", "favorite", "yêu thích", "đã lưu", "saved");
   if (reserved.contains(normalized)) throw new BadRequestException("Reserved collection name");
   ```
   Locale.ROOT prevents Turkish-dotless-I and similar locale quirks. NFKC handles compatibility decompositions.
4. **Delete guard**: `CollectionService.delete(collectionId, userId)` MUST check `if (collection.isSystem) throw BadRequestException("Cannot delete system collection")`. Without this, user can delete their Favorites and orphan Recipe-saves.
5. **DTO guard**: `CollectionRequest` DTO must NOT expose `isSystem` field (Jackson `@JsonIgnore` on setter OR simply omit the field). Server sets only — prevents client-spoofed system collections.
6. Idempotency: reuse existing `addRecipe(collectionId, recipeId)` — must no-op if already present. Verify current impl handles duplicate (use `Set` or check before add).

### Part B — BE Controller (0.5 day)

7. Add endpoints to `CollectionController`:
   - `@GetMapping("/favorites")` → `getOrCreateFavorites(principal.id)` (returns Collection metadata only, not populated recipes)
   - **`@GetMapping("/favorites/recipes")` with `@PageableDefault` → `Page<RecipeResponse>`** (NEW — fixes N+1). <!-- Updated: Validation Session 1 - V1 locked to batch findAllByIdIn -->
     - **Implementation (locked V1)**: Two queries — `getOrCreateFavorites(userId)` → `RecipeRepository.findAllByIdIn(entryIds, pageable)`. Single batch fetch, ordered by Pageable. $lookup aggregation rejected (YAGNI for hobby scale ~50 favorites).
   - **Recipe view-count side-effect guard (locked V2)**: <!-- Updated: Validation Session 1 - V2 query param approach -->
     - Add `?view=false` query param to `GET /api/recipes/{id}` (default `true` for backward compat). When `view=false`, `RecipeService.findById` skips `incrementViewCount`.
     - Favorites batch path uses an internal service method `RecipeService.findAllByIdsWithoutView(Collection<String> ids, Pageable p)` that routes through the same no-view path. Mobile favorites screen does NOT call the per-id endpoint so the query param is backend-facing only.
     - Code comment: "Saving a recipe should not inflate its view counter — batch reads from collection hydration skip view increment."
   - **Recipe filter in batch**: only return `PUBLISHED` recipes OR recipes authored by the current user (covers "saved my own draft" case) — same enumeration-oracle rule as add-recipe (see step 10/F14 below).
   - `@PostMapping("/favorites/recipes")` → `addRecipe(favId, request.recipeId)`
   - `@DeleteMapping("/favorites/recipes/{recipeId}")` → `removeRecipe(favId, recipeId)` → 204
   - `@GetMapping("/favorites/contains/{recipeId}")` → `ContainsResponse(saved: boolean)`
8. All wrapped in `ApiResponse`; JWT required via existing SecurityConfig pattern.
9. **Rate limit** favorites write endpoints (POST /favorites/recipes, DELETE /favorites/recipes/{id}) — 60 req/min/user via Bucket4j. Reuse pattern from Phase 4.3 upload rate limiter. Prevents rapid-fire abuse / accidental double-tap storm.
10. **Recipe existence + visibility check** on `addRecipe` path (prevents enumeration oracle — F14):
    ```java
    Recipe recipe = recipeRepository.findById(recipeId)
        .orElseThrow(() -> new NotFoundException("Recipe not found"));
    if (recipe.getStatus() != RecipeStatus.PUBLISHED && !recipe.getAuthorId().equals(userId)) {
        throw new NotFoundException("Recipe not found");  // SAME message/code as not-found → no enumeration oracle
    }
    ```
    Apply to BOTH `CollectionController.addRecipe` general endpoint AND new `/favorites/recipes` endpoint.

### Part C — BE Tests (0.5 day)

11. `FavoritesIntegrationTest`:

- First `GET /favorites` creates collection (count before=0, after=1, `isSystem=true`)
- Second `GET /favorites` reuses (no duplicate)
- Concurrent first-access from two threads creates exactly 1 Collection (compound unique index)
- Legacy collection with `isSystem=false` → self-heals to `isSystem=true` on next read
- `POST /favorites/recipes` adds; duplicate POST idempotent
- `DELETE /favorites/recipes/{id}` removes; missing recipe also 204
- `GET /favorites/contains/{id}` returns correct boolean
- **`GET /favorites/recipes` returns paginated `Page<RecipeResponse>`** with only PUBLISHED recipes (+ own drafts); single aggregated query (no N+1)
- **View-count NOT incremented** when favorites list fetched
- Adding non-existent recipe → 404 with generic message
- Adding another user's DRAFT recipe → 404 (NOT 403, prevents enumeration)
- Adding own DRAFT → 200 (author bypass)
- User A cannot access User B favorites
- **Attempt to DELETE `Favorites` system collection → 400** ("Cannot delete system collection")
- `POST /collections {name: "Favorites"}` → 400
- `POST /collections {name: "FAVORITES"}` → 400
- `POST /collections {name: "Fav\u200Borites"}` → 400 (zero-width char stripped by NFKC+\p{C})
- `POST /collections {name: "yêu thích"}` → 400
- `POST /collections {name: "  Favourites  "}` → 400 (trim + uk spelling)
- `POST /collections` request body with `isSystem: true` — field ignored; created collection has `isSystem=false`
- Rate limit: 61st POST /favorites/recipes within 60s → 429

### Part D — Mobile Hooks + Repo (1 day)

12. `favorites-repository.ts`:

- `getFavorites()` → Collection metadata (no recipes populated)
- **`getFavoritesRecipes(pageable)` → `Page<Recipe>`** (single BE call — replaces N+1 hydrate)
- `addRecipe(recipeId)` → Collection
- `removeRecipe(recipeId)` → void
- `isSaved(recipeId)` → boolean

13. `use-favorites.ts`: `useInfiniteQuery(['favorites','recipes'])` calling `getFavoritesRecipes(pageable)`. Single-roundtrip; no batch hydrate needed (BE now does the join).
14. `use-is-saved.ts`: `useQuery(['favorites', 'contains', recipeId])`.
15. `use-toggle-save.ts`: `useMutation` wrapping add/remove, with `onMutate` optimistic update on `['favorites', 'contains', recipeId]`, `onError` rollback, `onSettled` invalidate both `['favorites','recipes']` and `['favorites', 'contains', recipeId]`.

### Part E — Mobile UI (1 day)

16. `SaveButton` component: heart icon (filled/outline), tap → `useToggleSave`. Props: `recipeId`.
17. Wire into `RecipeDetailScreen` header-right (from Slice 1).
18. `FavoritesScreen`: reuse grid + card components from Slice 1. `useFavorites()` → render grid OR empty state if 0 entries. Infinite scroll via `useInfiniteQuery`.
19. `FavoritesEmptyState`: simple illustration + copy "Bấm tim để lưu công thức" + CTA to search.

### Part F — Mobile Tests (0.5 day)

20. `favorites-repository.test.ts` — mock api-client, verify endpoints including `getFavoritesRecipes` pageable.
21. `use-toggle-save.test.ts` — optimistic update + rollback on error.
22. `favorites-screen.test.tsx` — empty state, grid render, infinite scroll.
23. `save-button.test.tsx` — tap toggles icon state.

### Part G — Lint + Docs + Merge (0.5 day)

24. Run lint + both test suites; all green.
25. Update `docs/project-changelog.md` Slice 4 entry.
26. Update `docs/development-roadmap.md` — Phase 4 "Complete" after merge.
27. Commit: `feat(favorites): collection-based favorites BE + mobile screen`.

## Todo List

### BE

- [ ] Add `isSystem` + `@CompoundIndex(authorId+name, unique=true)` to `Collection`
- [ ] Pre-deploy duplicate-check aggregation + document manual dedup procedure
- [ ] `CollectionService.getOrCreateFavorites` via atomic `findAndModify` upsert
- [ ] Legacy self-heal (`isSystem != true` → set true on read)
- [ ] Delete guard for `isSystem=true` collections
- [ ] `CollectionRequest` DTO omits `isSystem` (server-set only)
- [ ] Unicode-aware reserved name check (NFKC + \p{C} strip + Locale.ROOT + multilingual set)
- [ ] Verify `addRecipe` idempotency
- [ ] 5 favorites endpoints in controller (incl. paginated `/favorites/recipes`)
- [ ] Recipe visibility check on addRecipe (PUBLISHED-or-own-draft) + uniform 404
- [ ] View-count side-effect NOT triggered by `/favorites/recipes` batch path
- [ ] Rate limit 60 req/min on favorites write endpoints (Bucket4j)
- [ ] `ContainsResponse` DTO
- [ ] `FavoritesIntegrationTest` (≥15 cases per Step 11)

### Mobile

- [ ] `favorites-repository.ts` (incl. paginated `getFavoritesRecipes`) + test
- [ ] `use-favorites.ts` with `useInfiniteQuery` (no N+1 hydrate)
- [ ] `use-is-saved.ts`
- [ ] `use-toggle-save.ts` + test (optimistic + rollback)
- [ ] `FavoritesEmptyState` component
- [ ] Rewrite `favorites-screen.tsx` (infinite scroll)
- [ ] `SaveButton` component + test
- [ ] Wire `SaveButton` into detail screen
- [ ] `favorites-screen.test.tsx` smoke (incl. paginated load)

### Close-out

- [ ] Lint + all tests green
- [ ] `docs/project-changelog.md` Slice 4 entry
- [ ] `docs/development-roadmap.md` Phase 4 → Complete
- [ ] Commit: `feat(favorites): collection-based favorites BE + mobile screen`

## Success Criteria

- [ ] Tap heart on detail → icon fills instantly (optimistic)
- [ ] Kill app, reopen detail → heart state persisted via BE
- [ ] Favorites screen shows saved recipes (paginated, infinite scroll, single BE call — no N+1)
- [ ] Unsave → recipe vanishes from Favorites; heart empty on detail
- [ ] Network error on save → icon reverts + error toast
- [ ] First-time user visits Favorites tab → empty state + auto-created Collection in BE
- [ ] User cannot create own collection named "Favorites" — including "FAVORITES", " Favourites ", "Fav\u200Borites", "yêu thích" (all 400)
- [ ] User cannot delete their system Favorites collection (400)
- [ ] Client cannot flag arbitrary collection as `isSystem=true` via API
- [ ] Concurrent first-access does NOT create duplicate Favorites collection
- [ ] Adding another user's DRAFT recipe to favorites → 404 (same message as missing recipe — no enumeration)
- [ ] User A cannot access User B favorites (403/404)
- [ ] Recipe view-count NOT incremented when favorites list fetched
- [ ] 61st save request within 60s → 429
- [ ] All BE + mobile tests pass; no regression

## Risk Assessment

| Risk                                                                    | Likelihood  | Impact | Mitigation                                                                             |
| ----------------------------------------------------------------------- | ----------- | ------ | -------------------------------------------------------------------------------------- |
| Race: two rapid taps create duplicate entries                           | Low         | Medium | Idempotent `addRecipe` uses Set semantics or existence check                           |
| Race: concurrent first-access creates duplicate Favorites collection    | Medium      | High   | `findAndModify` atomic upsert + compound unique index (authorId+name)                  |
| User already has collection named "Favorites" (legacy data)             | Medium      | Medium | Pre-deploy dedup aggregation + self-heal `isSystem` on read + documented manual dedup  |
| User deletes own Favorites by accident → orphan saves                   | Medium      | High   | Delete guard rejects `isSystem=true` collections (400)                                 |
| Client spoofs `isSystem=true` via request body                          | Medium      | High   | `CollectionRequest` DTO omits field; server-set only                                   |
| Enumeration oracle: attacker probes private DRAFT recipes via favorites | Medium      | Medium | Uniform 404 (same code + message) for not-found AND other-user's-draft                 |
| Favorites batch fetch inflates recipe view-counts                       | Medium      | Low    | Dedicated service method skips `incrementViewCount`                                    |
| Optimistic update flicker on slow network                               | Medium      | Low    | Use `onMutate`/`onError` correctly; debounce double-taps                               |
| N+1 recipe fetch on favorites screen                                    | High        | Medium | Dedicated `/favorites/recipes` paginated endpoint (aggregation or findAllByIdIn batch) |
| Reserved-name bypass via Unicode zero-width / compatibility chars       | Medium      | Medium | NFKC normalize + `\p{C}` strip + Locale.ROOT lowercase + multilingual reserved set     |
| Rapid-fire save/unsave storm (bot or bug)                               | Low         | Medium | Bucket4j 60 req/min rate limit on write endpoints                                      |
| Favorites count grows huge → slow load                                  | Low (hobby) | Low    | Paginated `/favorites/recipes` endpoint from day one                                   |
| Test flakiness on optimistic timing                                     | Medium      | Low    | Use `waitFor` + deterministic mock responses                                           |

## Security Considerations

- **JWT required** on all favorites endpoints; use `@AuthenticationPrincipal` to derive `userId`.
- **Ownership check**: `CollectionService.addRecipe/removeRecipe` must verify `collection.authorId == principal.id` — existing pattern; verify.
- **Reserved name**: block user-created "Favorites" via Unicode NFKC + control-char strip + Locale.ROOT lowercase + multilingual reserved set (`favorites`, `favourites`, `favorite`, `yêu thích`, `đã lưu`, `saved`) — prevents bypass via zero-width chars or locale quirks.
- **System collection protection**: `isSystem=true` collections cannot be deleted via user API (400).
- **DTO hardening**: `CollectionRequest` DOES NOT carry `isSystem` — prevents client from flagging arbitrary collections as system.
- **Compound unique index** `(authorId, name)`: defense-in-depth against race-created duplicate Favorites.
- **Enumeration oracle prevention**: adding non-existent recipe AND adding another user's DRAFT return identical 404 with same message — prevents attacker enumerating private drafts.
- **View-count not incremented** by favorites batch fetch — prevents metric gaming by spamming save/list cycles.
- **Rate limit** 60 req/min on write endpoints (POST/DELETE /favorites/recipes) via Bucket4j — prevents abuse.
- **No leak**: `contains` endpoint only reveals user's own save status.
- **Input**: `recipeId` validated as existing ObjectId; reject invalid format (400).

## Rollback Plan

- **BE**: revert commit → favorites endpoints gone; auto-created collections remain as harmless user collections (rename to "Favorites (legacy)" if re-shipped differently).
- **Mobile**: revert → favorites screen back to stub; no data loss.
- **Data**: `isSystem` field addition is backward-compat (absent = false).

## Next Steps

- Final slice — Phase 4 complete when merged.
- Post-merge: update `docs/development-roadmap.md` to mark Phase 4 fully complete; set Phase 5 "Planned".
- Future (Phase 5): share recipe, deep links, step-level photos, interactions (comments, cooksnaps, reactions) wire-up.
