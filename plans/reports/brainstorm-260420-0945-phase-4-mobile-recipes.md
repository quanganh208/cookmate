---
type: brainstorm
date: 2026-04-20
phase: 4
scope: mobile-recipes
status: approved
---

# Brainstorm — Phase 4 Mobile Recipes Implementation

## Problem Statement

Backend đã ship controllers cho recipes / ingredients / collections / interactions (comments, cooksnaps, reactions). Mobile vẫn là stubs 25–90 lines hiển thị "Coming soon" + 1 screen detail dùng mock data. Roadmap ghi Phase 4 "Planned" nhưng thực tế BE đã xong ~60%. Mục tiêu: wire toàn bộ Phase 4 mobile vào BE thật, xóa mocks, thêm BE endpoints còn thiếu (search, image upload, favorites helper).

## Current State Audit

### Đã hoàn thành

- **Phase 1** Foundation: monorepo pnpm, Docker Compose MongoDB 8.0, CI GitHub Actions, ESLint/Prettier
- **Phase 2** Home UI: 5-tab nav, 7 components <200 lines, 15 mock recipes, brand colors
- **Phase 2.5** Mobile Restructure: feature-based, Zustand + TanStack Query + MMKV offline
- **Phase 3** Auth Backend: register/login/Google OAuth/refresh/logout/me, JWT + RBAC, refresh token MongoDB TTL, BCrypt 12
- **Phase 3.5** Mobile Auth + BE Password Reset: 8 auth endpoints wired mobile, forgot/reset flow, SecureStore, single-flight 401 refresh, AuthGate, deep link `cookmate://reset`
- **Phase 4 BE (undocumented)**: RecipeController (CRUD + featured + category + author), IngredientController (CRUD + category), CollectionController (CRUD + add/remove recipes), CommentController, CooksnapController, ReactionController

### Còn thiếu / stub

- **Mobile screens stubs**: create-recipe (34 LOC), favorites (34 LOC), search (25 LOC), recipe-detail (88 LOC mock), profile (90 LOC basic)
- **FE repository mismatch**: `recipes-repository.ts` kỳ vọng `Recipe[]`, BE trả `Page<RecipeResponse>` + envelope `ApiResponse<>`
- **BE thiếu**: `POST /api/uploads/image`, `GET /api/recipes/search`, favorites helper endpoints
- **Roadmap stale**: chưa phản ánh BE Phase 4 đã xong

## Decisions (locked với user)

| #   | Decision           | Choice                                            |
| --- | ------------------ | ------------------------------------------------- |
| D1  | Approach           | **A — Vertical slices**                           |
| D2  | Slice order        | **Detail → Search → Create → Saved**              |
| D3  | Image storage      | **Cloudflare R2** (S3-compatible)                 |
| D4  | Upload flow        | **Multipart proxy qua BE**                        |
| D5  | Favorites model    | **Auto-create Collection "Favorites"** per user   |
| D6  | Search scope       | **Full-text title+description** (MongoDB `$text`) |
| D7  | Ingredient catalog | **Link to catalog + autocomplete**                |
| D8  | R2 access policy   | **Public-read**                                   |
| D9  | Image resize       | **Client-side** (expo-image-manipulator)          |
| D10 | Pagination UI      | **Infinite scroll** (useInfiniteQuery)            |

## Approaches Evaluated

### Approach A — Vertical Slices ✅ CHỌN

Ship từng feature end-to-end. Order easiest-first: Detail → Search → Create → Saved.

- **Pro**: demo targets rõ ràng, no half-baked code, giữ momentum
- **Con**: Contract alignment phải làm lặp lại ở slice 1

### Approach B — Read-first / Write-later ❌

Split 4.1 (read, no uploads) + 4.2 (write + upload). Ship "real app" sớm.

- **Pro**: cô lập rủi ro image upload
- **Con**: Content creators bị chặn đến 4.2

### Approach C — Horizontal (infra-first) ❌

Fix contracts/pagination/errors trước, features sau.

- **Pro**: Clean architecture
- **Con**: Week 1 zero visible progress, bad for hobby motivation

## Recommended Solution — Implementation Breakdown

### Slice 1: Recipe Detail (~3–4 ngày)

**BE**: không đổi (endpoints đã sẵn).

**FE**:

- `apps/mobile/features/recipes/types.ts` — align với BE `RecipeResponse` (title, description, imageUrl, serving, prepTime, cookTime, difficulty, cuisine, status, viewCount, likeCount, isFeatured, authorId, category, steps[], ingredients[], author info, timestamps)
- `apps/mobile/shared/api/api-client.ts` — confirm envelope unwrap `ApiResponse<T>` → `T`
- `apps/mobile/features/recipes/api/recipes-repository.ts` — rewrite:
  - `list(pageable)` → `Page<Recipe>`
  - `getById(id)` → `Recipe`
  - `findByCategory(category, pageable)`, `findFeatured(pageable)`, `findByAuthor(authorId, pageable)`
- `apps/mobile/features/recipes/hooks/use-recipes.ts`:
  - `useInfiniteRecipes()` (home feed)
  - `useRecipe(id)` (detail)
  - `useFeaturedRecipes()`, `useRecipesByCategory(cat)`
- `apps/mobile/features/recipes/screens/recipe-detail-screen.tsx` — wire real data, skeleton loading, error+retry, show: hero image, title, author, stats (views/likes), prep/cook time, difficulty, cuisine, ingredients list, numbered steps
- `apps/mobile/features/home/screens/home-screen.tsx` + children — delete `mock-recipes.ts`, feed real data
- Components mới: `RecipeDetailSkeleton`, `ErrorView`
- Tests: api-client envelope/Page mapping, hook loading/error, detail screen smoke

### Slice 2: Search (~2–3 ngày)

**BE**:

- `RecipeController.search(String q, Pageable)` → `GET /api/recipes/search?q=&page=`
- `RecipeRepository.findByTextSearch(TextCriteria, Pageable)` — dùng `@TextIndexed` existing
- Consider language config `'none'` cho TextIndex nếu cần Vietnamese tokenization
- Integration test: search by text, empty query → 400, pagination

**FE**:

- `apps/mobile/features/search/screens/search-screen.tsx` — full implementation:
  - `SearchBar` (reuse từ home)
  - Debounced input (300ms) dùng `useDeferredValue` or custom hook
  - States: idle (recent searches) / loading / empty-results / results-grid
  - Recent searches persisted trong MMKV
- `apps/mobile/features/search/hooks/use-recipes-search.ts`:
  - `useRecipesSearch(query)` với `useInfiniteQuery`, `enabled: !!query.trim()`
- `apps/mobile/features/search/api/search-repository.ts`
- Tests: debounce, empty/error/success, MMKV recent searches

### Slice 3: Create Recipe + R2 Upload (~5–7 ngày, nặng nhất)

**BE**:

- **Dependencies**: `software.amazon.awssdk:s3` (R2 S3-compatible)
- `backend/src/main/java/com/cookmate/upload/`
  - `UploadController` → `POST /api/uploads/image`
  - `R2Service` — inject S3Client configured cho R2 endpoint
  - `application.yml`: `r2.endpoint`, `r2.bucket`, `r2.access-key`, `r2.secret-key`, `r2.public-url`
  - Env vars + GitHub Actions secrets
- Validation: multipart file size ≤5MB, MIME image/jpeg|png|webp, generate UUID filename
- Response: `{ url: "https://pub-xxx.r2.dev/<uuid>.jpg" }`
- Rate limit per user (tạm share rate limiter với password-reset pattern)
- Test: UploadControllerIntegrationTest với MockMvc + Testcontainers LocalStack (hoặc MinIO) cho R2 emulation

**FE**:

- Dependencies: `expo-image-picker`, `expo-image-manipulator`
- `apps/mobile/features/create-recipe/`
  - `api/upload-repository.ts` — `uploadImage(uri) → url`
  - `api/recipes-repository.ts` thêm `create(CreateRecipeRequest)`
  - `hooks/use-create-recipe.ts` (mutation)
  - `hooks/use-ingredients-search.ts` (for autocomplete)
  - `components/recipe-image-picker.tsx` — picker → client resize (1280px, 80% quality) → upload
  - `components/step-input.tsx` — dynamic list với add/remove/reorder
  - `components/ingredient-input.tsx` — autocomplete từ `GET /api/ingredients` + quantity + unit
  - `components/recipe-form-layout.tsx`
  - `schemas/create-recipe-schema.ts` — Zod (title ≥3, steps ≥1, ingredients ≥1, prep/cook time positive)
- `screens/create-recipe-screen.tsx` — react-hook-form + Zod, useFieldArray cho steps/ingredients, DRAFT/PUBLISHED toggle, submit → navigate detail
- Tests: Zod schema, upload success/failure, form submit flow, autocomplete

**Note**: Ingredient catalog cần seed data. Add `IngredientSeeder.java` hoặc migration script với 100–200 ingredients phổ biến (Vietnamese + international). Coi như sub-task của Slice 3.

### Slice 4: Saved / Favorites (~3–4 ngày)

**BE**:

- `Collection` model thêm field `isSystem` (boolean) hoặc convention `name = "Favorites"` + `authorId`
- `CollectionService.getOrCreateFavorites(userId)` — lazy create nếu chưa có
- Endpoints:
  - `GET /api/collections/favorites` → trả Collection (auto-create nếu cần)
  - `POST /api/collections/favorites/recipes` body `{ recipeId }`
  - `DELETE /api/collections/favorites/recipes/{recipeId}`
  - `GET /api/collections/favorites/contains/{recipeId}` → `{ saved: boolean }`
- Test: auto-create, add/remove, idempotency

**FE**:

- `apps/mobile/features/favorites/api/favorites-repository.ts`
- `apps/mobile/features/favorites/hooks/use-favorites.ts`, `use-is-saved.ts`, `use-toggle-save.ts`
- `apps/mobile/features/favorites/screens/favorites-screen.tsx` — grid reuse `RecipeCardCompact`, infinite scroll, empty state
- `apps/mobile/features/recipes/components/save-button.tsx` — heart/bookmark toggle trong detail screen + optimistic update qua React Query
- Tests: save/unsave, optimistic update rollback on error, list rendering

## Architecture Impact

### Wire Format Alignment (Slice 1)

```
BE: ResponseEntity<ApiResponse<Page<RecipeResponse>>>
  → { data: { content: [...], pageable, totalElements, ... }, error: null }

FE api-client: unwrap envelope → Page<Recipe>
FE useInfiniteQuery: getNextPageParam dùng Page.number + Page.last
```

### Upload Flow (Slice 3)

```
[Mobile] pick image (expo-image-picker)
  ↓ client resize (expo-image-manipulator) 1280px / 80% quality
[Mobile] POST /api/uploads/image (multipart)
  ↓ JWT Bearer + content-type: multipart/form-data
[BE] validate (size/MIME) → generate UUID → R2Service.putObject
  ↓ AWS S3 SDK → R2 endpoint
[R2] store object, public-read ACL
[BE] return { url: "https://pub-xxx.r2.dev/<uuid>.jpg" }
[Mobile] set form imageUrl → submit POST /api/recipes
```

### Favorites Flow (Slice 4)

```
First save:
  Mobile → POST /api/collections/favorites/recipes { recipeId }
  BE: getOrCreateFavorites(userId) → CollectionService.addRecipe
  Returns Collection

Subsequent:
  Same endpoint, collection already exists

List:
  GET /api/collections/favorites → Collection { entries: [...] }
  Mobile hydrate recipes from Collection.entries[].recipeId
```

## Risks

| Risk                                          | Severity    | Mitigation                                                                           |
| --------------------------------------------- | ----------- | ------------------------------------------------------------------------------------ |
| R2 credentials leak                           | High        | env vars only, `.gitignore`, GitHub Actions secrets, pre-commit hook scan            |
| Mobile camera photos >10MB                    | Medium      | Client resize 1280px trước upload, BE reject >5MB                                    |
| MongoDB `$text` không xử lý tiếng Việt tốt    | Medium      | TextIndex `language: 'none'` → tokenize by whitespace; fallback regex search nếu cần |
| BE multipart upload bottleneck                | Low (hobby) | Accepted trade-off; migrate sang presigned URL khi traffic tăng                      |
| Collection "Favorites" tên trùng user-created | Low         | Reserved name convention + BE validation block user tạo collection tên "Favorites"   |
| Optimistic save-button flicker                | Low         | React Query optimistic update + onError rollback                                     |
| Concurrent favorites add race                 | Low         | Upsert pattern in CollectionService                                                  |

## Security Considerations

- **Upload endpoint**: JWT required, rate limit per user (e.g. 20 uploads/hour), MIME whitelist (jpeg/png/webp), file size ≤5MB, filename sanitization (UUID only)
- **R2 bucket**: Public-read cho content, write-only via BE API key, không expose R2 credentials ra mobile
- **Search**: Escape user input cho MongoDB `$text` (Spring Data handles) — không concat raw query
- **Create-recipe**: Validate author matches authenticated user trong service (đã pattern sẵn ở recipe update/delete)
- **Favorites**: User chỉ modify được favorites của mình (authorId check)

## Success Criteria

- [ ] Tất cả 4 screens mobile show real API data, không còn mocks
- [ ] Create recipe end-to-end: form → image upload → save → xuất hiện trong list
- [ ] Search trả kết quả chính xác cho full-text query
- [ ] Save/unsave toggle hoạt động, Favorites screen hiển thị đúng
- [ ] Test coverage mỗi slice: unit (hooks, schemas) + integration (API client) + screen smoke
- [ ] No regression: 18/18 mobile tests + 61/61 backend tests vẫn pass
- [ ] Lint + format clean
- [ ] Roadmap + changelog updated reflecting BE Phase 4 reality + mobile wire-up completion

## Validation Methods

- **Slice 1**: Manual — tap recipe card từ home feed → detail load từ BE (không mock). E2E: delete mock file, app vẫn chạy.
- **Slice 2**: Manual — type "pho" → results. Empty query → recent searches. Network offline → error state.
- **Slice 3**: Manual — create recipe với image, reload app → recipe xuất hiện trong feed. Image URL mở được trong browser (public R2).
- **Slice 4**: Manual — tap save trên detail → favorites tab có recipe. Unsave → biến mất. Kill app, reopen → state persist qua BE.
- **Automated**: `pnpm backend:test`, mobile test via `pnpm mobile test` (TODO verify script exists)

## Next Steps / Dependencies

1. **Approval of this brainstorm** → invoke `/ck:plan` với context là report này
2. **Cloudflare R2 setup** (sub-task, user phải làm manual):
   - Create R2 account + bucket `cookmate-images`
   - Generate API token (Object Read + Write)
   - Enable public-read domain: `pub-xxx.r2.dev`
   - Add secrets to `.env.local` và GitHub Actions
3. **Ingredient seed data** (sub-task Slice 3): chuẩn bị JSON 100–200 ingredients trước khi implement autocomplete
4. **Roadmap update**: sau Slice 1 merge, update `docs/development-roadmap.md` — Phase 4 "In Progress", BE sub-items "Complete"

## Unresolved Questions

- **Q1**: BE có cần `RecipeImageUpload` association model (track uploads → recipes để cleanup orphan images) hay để đơn giản mọi image URL là self-managed? → Recommend YAGNI, skip.
- **Q2**: Step có cần image riêng không (step-by-step photo tutorials)? Model `Step` hiện không có imageUrl. → Flag cho user, có thể Phase 5.
- **Q3**: Cuisine/difficulty có enum cố định (BE) hay free-text? Model hiện là String. → Recommend add `@Pattern` validation + FE picker với enum list.
- **Q4**: Share recipe ra ngoài (deep link `cookmate://recipe/{id}`)? → Out of scope Phase 4, log for Phase 5.
- **Q5**: Draft recipes có lưu local (MMKV) trước khi user submit không? → Recommend có, nhưng có thể làm sau slice 3 nếu scope tight.
