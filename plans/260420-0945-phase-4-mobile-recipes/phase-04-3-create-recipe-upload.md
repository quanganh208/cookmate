# Phase 4.3 — Create Recipe + R2 Image Upload

## Context Links

- **Brainstorm**: `/Volumes/QUANGANH1TB/Coding/cookmate/plans/reports/brainstorm-260420-0945-phase-4-mobile-recipes.md`
- **Overview**: `./plan.md`
- **Slice 1 (blocker)**: `./phase-04-1-recipe-detail.md`
- **BE reference**: `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/recipe/`, `.../ingredient/`
- **Mobile reference**: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/auth/` (RHF + Zod pattern)
- **Docs**: `/Volumes/QUANGANH1TB/Coding/cookmate/docs/system-architecture.md`, `/Volumes/QUANGANH1TB/Coding/cookmate/docs/deployment-guide.md`

## Overview

- **Priority**: P1
- **Status**: complete (2026-04-20) — shipped as 4.3a (backend, PR #7) + 4.3b (mobile, PR #8). Real-R2 smoke test verified.
- **Estimate**: 5–7 days (heaviest slice)
- **Description**: Ship BE `POST /api/uploads/image` (multipart proxy → Cloudflare R2). Ship mobile create-recipe form (react-hook-form + Zod) with image picker, client resize, ingredient autocomplete, dynamic steps/ingredients arrays, publish/draft toggle. Seed ingredient catalog (100–200 items).

## Prerequisites (MANUAL — user must complete before coding)

1. **Cloudflare R2 account** (free tier OK for hobby)
2. **Create bucket** `cookmate-images`
3. **API Token**: Object Read + Write scope on bucket
4. **Public domain**: enable `pub-<hash>.r2.dev` for bucket (public-read)
5. **Env vars** in `backend/.env` (and `.env.example` stub):
   - `R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`
   - `R2_BUCKET=cookmate-images`
   - `R2_ACCESS_KEY_ID=***`
   - `R2_SECRET_ACCESS_KEY=***`
   - `R2_PUBLIC_URL=https://pub-<hash>.r2.dev`
6. **GitHub Actions secrets**: same keys in repo settings for CI
7. **Verify**: `.gitignore` covers `.env`; run pre-commit secret scan
8. **R2 SDK metadata support verification** <!-- Updated: Validation Session 1 - V7 -->: Before implementing upload, verify that AWS SDK v2 `PutObjectRequest.metadata(Map)` actually propagates `Content-Disposition` and `X-Content-Type-Options` to R2 response headers. Test: upload a file via dev BE → curl the public URL → inspect response headers. If R2 strips these object metadata (some S3-compatible stores do), fall back to **Cloudflare Transform Rules** at bucket/CDN layer — add HTTP response header transform for all objects in bucket. Document the verified configuration (SDK path vs Transform Rules) in a note at top of `R2Service.java`.
9. **Fail-fast on missing env vars**: `${r2.public-url}` used in `@Pattern` regex for `imageUrl` validation. If env var is empty/absent, regex becomes `^$/...` which matches nothing — every recipe create fails. Add Spring `@PostConstruct` check in `R2Service` that asserts all 5 R2 env vars are non-empty at boot; fail app startup if any missing. Prevents confusing runtime errors.

## Key Insights

- Cloudflare R2 is S3-compatible → use `software.amazon.awssdk:s3` (v2).
- Multipart proxy trades simplicity for BE bandwidth cost — accepted for hobby; can migrate to presigned URL later.
- Client resize (expo-image-manipulator 1280px max, 80% JPEG) keeps uploads <1MB typically.
- Ingredient catalog must exist before autocomplete works → seed script required.
- `react-hook-form` + `zod` + `@hookform/resolvers/zod` pattern already used in Slice 3.5 auth; reuse.
- `useFieldArray` for dynamic steps/ingredients lists.

## Requirements

### Functional

**BE Upload**

- [ ] `POST /api/uploads/image` — multipart form-data field `file`, JWT required
- [ ] **Content-detected MIME validation via Apache Tika** (NOT request header) ∈ {image/jpeg, image/png, image/webp} — **SVG permanently excluded**
- [ ] **Server-side re-encode** via `ImageIO.read` + `ImageIO.write` (strips EXIF, normalizes, blocks polyglot files); reject if `ImageIO.read` returns null
- [ ] Validate size ≤5MB
- [ ] Generate UUID filename + correct extension (determined from content-detected MIME)
- [ ] Upload to R2 via S3Client `putObject` — **no ACL param** (R2 rejects S3 canned ACLs; public access controlled by bucket `pub-xxx.r2.dev` setting)
- [ ] Object metadata: `Content-Disposition: attachment` + `X-Content-Type-Options: nosniff` where R2 supports
- [ ] Return `{ url: "https://pub-xxx.r2.dev/<uuid>.<ext>" }`
- [ ] Idempotency: honor `X-Upload-Id` header — return cached URL on retry
- [ ] Rate limit: 20 uploads/hour/user (reuse pattern from password-reset)

**BE Recipe Create** (endpoint exists; verify + harden)

- [ ] `POST /api/recipes` accepts `CreateRecipeRequest`
- [ ] Author = authenticated user (from JWT)
- [ ] Status enum: DRAFT | PUBLISHED
- [ ] `@Pattern` validation: difficulty ∈ {EASY, MEDIUM, HARD}; cuisine free-text but ≤50 chars
- [ ] Returns created `RecipeResponse`

**BE Ingredient Seeder**

- [ ] `IngredientSeeder.java` as `CommandLineRunner` — runs once on boot if collection empty
- [ ] 100–200 common ingredients, Vietnamese + international (name + category + unit suggestions)
- [ ] Idempotent: skip if any ingredient exists

**Mobile Form**

- [ ] Zod schema: title ≥3 chars, description optional ≤500, imageUrl required, serving ≥1, prepTime/cookTime ≥0, difficulty enum, cuisine ≤50, ingredients array ≥1, steps array ≥1
- [ ] Image picker (camera or library) → client resize (1280px, 80%) → BE upload → store URL in form
- [ ] Steps: dynamic array (add/remove/reorder) with text + orderIndex
- [ ] Ingredients: dynamic array with autocomplete from `GET /api/ingredients?q=`, quantity, unit
- [ ] Publish/Draft toggle
- [ ] Submit → `POST /api/recipes` → invalidate recipe lists → navigate to detail
- [ ] Field-level error display; disable submit during upload/mutation

### Non-Functional

- [ ] Upload <5s on 4G for 1MB image
- [ ] Form screen <200 LOC via component extraction
- [ ] Mutation uses optimistic list invalidation (not optimistic add)
- [ ] No regression: all existing tests green

## Architecture

### Upload Flow

```
Mobile picks image → read EXIF Orientation (tag 274)
  → expo-image-manipulator: explicit rotate (orientation→degrees) THEN resize (1280w, 0.8 quality, JPEG)
  → generate uploadId = UUID (per form state)
  → FormData { file: resized.blob } + header X-Upload-Id: uploadId
  → api-client.post('/api/uploads/image', formData, multipart)
  → JWT interceptor adds Bearer
BE UploadController.upload(MultipartFile file, Authentication auth, @RequestHeader("X-Upload-Id") String uploadId):
  → Bucket4j rate-limit check (20/hour/user)
  → if pending_uploads.findByUploadId(uploadId) exists → return cached url (idempotent retry)
  → Tika content-detected MIME validation (whitelist jpeg/png/webp only)
  → size ≤5MB check
  → ImageIO.read → if null reject; ImageIO.write → normalized bytes (EXIF stripped, polyglot-safe)
  → UUID filename + ext from detected MIME
  → R2Service.putObject(key, inputStream, contentLength, contentType)  // NO ACL param
  → persist pending_uploads { uploadId, userId, url, uploadedAt=now, linkedToRecipeId=null, TTL 24h }
  → returns PublicUrl = R2_PUBLIC_URL + "/" + key
  → ApiResponse<UploadResponse { url }>
Mobile stores url in RHF form → user fills rest → submit
  → POST /api/recipes { title, imageUrl: url, ... }
  → BE validates imageUrl matches ${R2_PUBLIC_URL}/<uuid>.<ext> regex (reject foreign URLs)
  → creates Recipe, sets pending_uploads.linkedToRecipeId = recipe.id
  → returns RecipeResponse
  → mobile navigates to /recipes/:id

Recipe delete → BE calls R2 deleteObject for each imageUrl → deletes pending_upload record

Orphan Janitor (daily 03:00 cron):
  → pending_uploads where linkedToRecipeId IS NULL AND uploadedAt < now()-24h
  → R2 deleteObject + delete record
```

### R2 ACL Note

Cloudflare R2 does NOT support S3 canned ACL headers (`x-amz-acl`). `putObject` must NOT pass ACL param. Public access is controlled at bucket level via `pub-xxx.r2.dev` subdomain enabled in Prerequisites. Code comments in `R2Service` MUST document this explicitly so future devs don't add ACL param (silent failure on R2).

### Components

- **BE new package**: `backend/src/main/java/com/cookmate/upload/`
  - `UploadController`, `R2Service`, `R2Config`, `UploadResponse` DTO, `RateLimiter` (share or new)
- **BE seeder**: `backend/src/main/java/com/cookmate/ingredient/seed/IngredientSeeder.java` + resource JSON
- **Mobile new feature**: `apps/mobile/features/create-recipe/` with `api/`, `hooks/`, `screens/`, `components/`, `schemas/`, `index.ts`

## Related Code Files

### Modify

- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/pom.xml` (add `software.amazon.awssdk:s3`, `org.apache.tika:tika-core`)
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/resources/application.yml` (R2 config block + multipart caps: `spring.servlet.multipart.max-file-size=5MB`, `max-request-size=6MB`, `file-size-threshold=0` (force disk-buffer), `location=${java.io.tmpdir}`)
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/config/SecurityConfig.java` (protect `/api/uploads/**`, allow `/api/ingredients` read)
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/recipe/dto/CreateRecipeRequest.java` (add `@Pattern` difficulty, `@Size` cuisine)
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/recipe/service/RecipeService.java` (verify author ownership, status enum handling)
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/create-recipe/screens/create-recipe-screen.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/create-recipe/index.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/package.json` (add `expo-image-picker`, `expo-image-manipulator`)
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/app.json` (image picker permissions: iOS `NSPhotoLibraryUsageDescription`, `NSCameraUsageDescription`)
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/.env.example` (add R2\_\* stubs)
- `/Volumes/QUANGANH1TB/Coding/cookmate/.github/workflows/*.yml` (pass R2\_\* secrets to BE tests using LocalStack/MinIO)
- `/Volumes/QUANGANH1TB/Coding/cookmate/docs/deployment-guide.md` (R2 setup section)

### Create

**Backend**

- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/upload/UploadController.java`
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/upload/R2Service.java`
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/upload/R2Config.java`
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/upload/dto/UploadResponse.java`
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/upload/exception/UploadException.java`
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/upload/model/PendingUpload.java`
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/upload/repository/PendingUploadRepository.java`
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/upload/scheduler/UploadJanitor.java`
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/ingredient/seed/IngredientSeeder.java`
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/resources/seed/ingredients.json`
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/test/java/com/cookmate/upload/UploadControllerIntegrationTest.java` (MinIO/LocalStack Testcontainer)
- `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/test/java/com/cookmate/ingredient/IngredientSeederTest.java`

**Mobile**

- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/create-recipe/api/upload-repository.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/create-recipe/api/recipes-mutation-repository.ts` (or extend slice-1 recipes-repository with `create`)
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/create-recipe/api/ingredients-repository.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/create-recipe/hooks/use-create-recipe.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/create-recipe/hooks/use-upload-image.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/create-recipe/hooks/use-ingredients-search.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/create-recipe/schemas/create-recipe-schema.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/create-recipe/components/recipe-image-picker.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/create-recipe/components/step-input.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/create-recipe/components/ingredient-input.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/create-recipe/components/recipe-form-layout.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/create-recipe/components/difficulty-picker.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/create-recipe/utils/resize-image.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/create-recipe/__tests__/create-recipe-schema.test.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/create-recipe/__tests__/upload-repository.test.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/create-recipe/__tests__/use-upload-image.test.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/create-recipe/__tests__/resize-image.test.ts`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/create-recipe/__tests__/create-recipe-screen.test.tsx`
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/shared/api/__tests__/api-client-error-scrub.test.ts`

### Delete

- None

## Implementation Steps

### Part A — R2 Setup (user, manual, 1h)

1. Complete **Prerequisites** section above. Verify env loads on local BE.

### Part B — BE Upload Endpoint (1.5 days)

2. Add `software.amazon.awssdk:s3` + `org.apache.tika:tika-core` dependencies; refresh Maven.
3. Add multipart caps to `application.yml`: `spring.servlet.multipart.max-file-size=5MB`, `max-request-size=6MB`, `file-size-threshold=0` (force disk-buffer so Tomcat doesn't hold MB in memory), `location=${java.io.tmpdir}`.
4. `R2Config`: `@Bean S3Client` configured with R2 endpoint + credentials.
5. `R2Service.putObject(String key, InputStream stream, long contentLength, String contentType)` → uses `RequestBody.fromInputStream(stream, contentLength)`. **No ACL param** (add code comment: "R2 does not support canned ACLs; bucket pub-xxx.r2.dev controls public access"). Returns public URL.
6. `PendingUpload` Mongo doc: `{ uploadId (UUID, indexed unique), userId, url, uploadedAt (TTL 24h via `@Indexed(expireAfterSeconds=86400)` or equivalent), linkedToRecipeId (nullable) }`. `PendingUploadRepository` extends `MongoRepository`.
7. `UploadController.upload`:
   - Accept `MultipartFile file`, auth principal, `@RequestHeader("X-Upload-Id") String uploadId`.
   - Bucket4j rate-limit check (20/hour/user; 401 if no JWT).
   - **Idempotency**: if `pendingUploadRepository.findByUploadId(uploadId)` present and userId matches → return cached `UploadResponse` (no R2 write).
   - **Tika MIME detection**: `new Tika().detect(TikaInputStream.get(file.getInputStream()))` → validate ∈ {image/jpeg, image/png, image/webp}. **SVG permanently excluded** (add unit test that image/svg+xml → 415).
   - **Re-encode**: `BufferedImage img = ImageIO.read(file.getInputStream())` → if `null` reject as 415 (corrupt/polyglot). `ImageIO.write(img, format, outBytes)` to get normalized bytes (strips EXIF, prevents JPEG-wrapped payload).
   - Generate UUID + ext (from content-detected MIME, not header).
   - `R2Service.putObject(key, new ByteArrayInputStream(outBytes), outBytes.length, contentType)` with object metadata `Content-Disposition: attachment` + `X-Content-Type-Options: nosniff` (via SDK's `PutObjectRequest.metadata()`).
   - Persist `PendingUpload { uploadId, userId, url, uploadedAt=Instant.now(), linkedToRecipeId=null }`.
   - Return `UploadResponse { url }`.
8. `SecurityConfig`: require JWT on `/api/uploads/**`.
9. Rate limiter: 20/hour/user via Bucket4j (reuse existing pattern if password-reset exposes one).
10. `UploadJanitor` `@Component` with `@Scheduled(cron="0 0 3 * * *")`: find `pendingUploads` where `linkedToRecipeId IS NULL AND uploadedAt < now.minus(24h)`; for each → `R2Service.deleteObject(key)` + delete record. Log per-batch summary.
11. **Recipe delete hook**: `RecipeService.delete` must call `r2Service.deleteObject` for `recipe.imageUrl` (parse key from URL) and delete matching `pendingUpload` record.
12. **Recipe create hook**: `RecipeService.create` sets `pendingUpload.linkedToRecipeId = recipe.id` by looking up via `findByUrl(imageUrl)`.
13. Integration test with LocalStack S3 (or MinIO Testcontainer):
    - Upload valid JPEG → 200 + URL + PendingUpload persisted
    - Same X-Upload-Id retry → 200 returns same URL, no second R2 PUT
    - Polyglot GIF-wrapped-PHP → ImageIO.read returns null → 415
    - SVG upload → 415 (explicit test)
    - Missing EXIF orientation JPEG → re-encoded bytes have no EXIF
    - Too large → 413; wrong MIME → 415; no JWT → 401
    - Janitor cron: insert pendingUpload uploaded 25h ago with null linkedToRecipeId → job deletes R2 + record

### Part C — Ingredient Seed (0.5 day)

14. Add `@Indexed(unique = true)` on `Ingredient.name` field (blocks duplicate seeds across concurrent boots).
15. Prepare `seed/ingredients.json` — 100–200 entries: `{name, category, commonUnits[]}`. Include Vietnamese (nước mắm, rau muống, thịt ba chỉ, ...) + international (salt, sugar, olive oil, ...).
16. `IngredientSeeder implements CommandLineRunner`: **per-item upsert** (not count==0 gate) — `mongoTemplate.upsert(Query.query(Criteria.where("name").is(ingredientName)), Update.fromDocument(new Document().append("$setOnInsert", entry)), Ingredient.class)`. Idempotent; safe on rolling deploy (multiple instances booting); safe on re-run.
17. Test: seeder runs on empty DB → N records; re-run → no duplicates (unique index enforces); partial collection → only missing inserted.

### Part D — BE Recipe Create Harden (0.5 day)

18. `CreateRecipeRequest`: add `@Pattern(regexp = "EASY|MEDIUM|HARD")` on difficulty, `@Size(max = 50)` on cuisine, `@Size(max = 500)` on description.
19. **`CreateRecipeRequest.imageUrl`**: add `@Pattern(regexp = "^${R2_PUBLIC_URL}/[a-f0-9-]+\\.(jpg|jpeg|png|webp)$")` — reject any imageUrl not matching our R2 bucket (blocks SSRF / image-hotlink / scraped-attribution abuse). Regex injected via `@Value("${r2.public-url}")`. Document in `application.yml` that `r2.public-url` must be env-driven.
20. `RecipeService.create` service-layer re-check: parse imageUrl against the pattern; reject (400) if mismatch. Also confirm `pendingUploads.findByUrl(imageUrl).userId == principal.id` (prevents using another user's orphan upload).
21. Verify `RecipeService.create` sets `author = authPrincipal`, defaults `status = DRAFT` if omitted.
22. On success, set `pendingUploads.linkedToRecipeId = recipe.id` (orphan janitor won't delete).
23. Integration test: create with valid payload → 201; invalid difficulty → 400; foreign imageUrl (non-R2 domain) → 400; no JWT → 401.

### Part E — Mobile Upload + Form (3–4 days)

24. Install `expo-image-picker`, `expo-image-manipulator`; add permissions to `app.json`.
25. **`utils/resize-image.ts`** — EXIF-orientation-safe pipeline:
    1. Pass `{ exif: true }` to `ImagePicker.launchCameraAsync` / `launchImageLibraryAsync` to preserve Orientation tag.
    2. Read `result.exif?.Orientation` (EXIF tag 274). Map values 1–8 → rotation degrees via helper `orientationToDegrees(ori)` (e.g. 1→0, 3→180, 6→90, 8→270).
    3. Apply explicit rotation FIRST via `ImageManipulator.manipulateAsync(uri, [{ rotate: degrees }], ...)` BEFORE resize.
    4. After manipulator resize (1280w, 0.8 JPEG), pixel orientation is correct; EXIF stripped is acceptable (correct appearance without metadata).
    5. Returns `{ uri, width, height, size }`.
    6. Fixture test: iPhone-portrait JPEG (Orientation=6) → pipeline output renders upright.
26. `api/upload-repository.ts`: `uploadImage(uri, uploadId): Promise<{url}>` — build FormData, attach `X-Upload-Id: uploadId` header, POST multipart.
27. **Axios error scrub interceptor**: register `api-client` response error interceptor that clones `error.config` and deletes `headers.Authorization`, `headers.Cookie`, and `data` (multipart form body) before any Sentry/console emission. Add unit test: thrown error object has no Bearer token visible in serialized form.
28. `hooks/use-upload-image.ts`: `useMutation` wrapping upload-repository. Generate `uploadId` in form state (UUID) so retries reuse the same ID → BE idempotency kicks in.
29. `api/ingredients-repository.ts`: `searchIngredients(q)` → `GET /api/ingredients?q=`.
30. `hooks/use-ingredients-search.ts`: debounced query, `enabled: q.length >= 2`.
31. `schemas/create-recipe-schema.ts`: Zod schema per Requirements.
32. `components/recipe-image-picker.tsx`: picker button → resize (with EXIF rotation) → upload → preview; shows progress.
33. `components/step-input.tsx`: RHF `useFieldArray` wrapper for steps.
34. `components/ingredient-input.tsx`: row with autocomplete name field + qty + unit.
35. `components/difficulty-picker.tsx`: segmented control EASY/MEDIUM/HARD.
36. `components/recipe-form-layout.tsx`: scrollable layout; composes above.
37. `hooks/use-create-recipe.ts`: `useMutation` POSTing to `/api/recipes`; `onSuccess` invalidate `['recipes']` lists + navigate detail.
38. `screens/create-recipe-screen.tsx`: RHF form, submit wires mutation, disable during in-flight upload/submit.

### Part F — Tests (1 day)

39. `create-recipe-schema.test.ts`: boundary cases (title 2 chars fail, 3 pass; steps empty fail; difficulty invalid).
40. `upload-repository.test.ts`: mock api-client, verify FormData + multipart headers + X-Upload-Id header.
41. `resize-image.test.ts`: fixture iPhone-portrait JPEG (Orientation=6) → output correctly rotated; Orientation=1 → no-op rotate; test `orientationToDegrees` mapping.
42. `api-client-error-scrub.test.ts`: simulated 401 error → serialized error contains no `Authorization` header value.
43. `use-upload-image.test.ts`: mutation success + error paths + idempotent retry reuses uploadId.
44. `create-recipe-screen.test.tsx`: smoke — fill form, submit, mutation called with correct payload.

### Part G — Docs + CI (0.5 day)

45. Update `docs/deployment-guide.md` with R2 setup walkthrough (including ACL-free public-read model).
46. Add R2 secrets to GHA workflow env; ensure upload integration test uses MinIO Testcontainer (no real R2 in CI).
47. **MANDATORY real-R2 smoke test**: manual upload 1 jpeg via dev BE pointing at real R2; confirm public URL opens in browser; screenshot + URL logged in PR description (see Success Criteria).
48. Update `docs/project-changelog.md` Slice 3 entry.
49. Run full lint + both test suites.

## Todo List

### Prerequisites

- [ ] Create R2 bucket + API token + public domain
- [ ] Set env vars local + GHA secrets
- [ ] Pre-commit secret scan pass

### BE

- [ ] Add `software.amazon.awssdk:s3` + `org.apache.tika:tika-core` deps
- [ ] `application.yml` multipart caps (file-size-threshold=0, tmpdir location)
- [ ] `R2Config` + `R2Service` (NO ACL param; code comment documenting R2 ACL limitation)
- [ ] `R2Service.putObject(String key, InputStream stream, long contentLength, String contentType)` + object metadata (Content-Disposition: attachment, nosniff)
- [ ] `PendingUpload` model + repository + TTL index (24h)
- [ ] `UploadController` with Tika content-MIME detection (SVG excluded), ImageIO re-encode (strips EXIF, blocks polyglot), X-Upload-Id idempotency
- [ ] `UploadResponse` DTO
- [ ] Rate limiter 20/hour/user
- [ ] `UploadJanitor` daily cron (orphan pending_uploads → R2 delete + record delete)
- [ ] Recipe delete hook: `R2Service.deleteObject` for recipe.imageUrl + pendingUpload cleanup
- [ ] Recipe create hook: link pendingUpload to recipe.id
- [ ] SecurityConfig route protection
- [ ] Upload integration tests (valid, retry-idempotency, SVG rejection, polyglot rejection, oversize, no-JWT, janitor cron)
- [ ] Harden `CreateRecipeRequest` validation (difficulty Pattern, cuisine Size)
- [ ] `CreateRecipeRequest.imageUrl` `@Pattern` regex injected via `@Value("${r2.public-url}")`
- [ ] Service-layer imageUrl re-check + pendingUpload ownership check
- [ ] Recipe create integration test (foreign imageUrl → 400 case)
- [ ] `Ingredient.name` `@Indexed(unique = true)`
- [ ] `IngredientSeeder` per-item upsert via `mongoTemplate.upsert` (idempotent, concurrent-boot-safe)
- [ ] Seeder test (empty + populated + partial)

### Mobile

- [ ] Install `expo-image-picker` + `expo-image-manipulator`
- [ ] Permissions in `app.json`
- [ ] `resize-image.ts` util with EXIF Orientation → explicit rotate BEFORE resize pipeline
- [ ] `orientationToDegrees(ori)` helper + unit test (1,3,6,8 values)
- [ ] `resize-image.test.ts` fixture iPhone-portrait JPEG renders upright
- [ ] `upload-repository.ts` with X-Upload-Id header + test
- [ ] Axios error scrub interceptor (strip Authorization/Cookie/form-data) + test
- [ ] `use-upload-image.ts` + test (idempotent uploadId reuse on retry)
- [ ] `ingredients-repository.ts`
- [ ] `use-ingredients-search.ts`
- [ ] Zod schema + test
- [ ] `recipe-image-picker.tsx`
- [ ] `step-input.tsx`
- [ ] `ingredient-input.tsx`
- [ ] `difficulty-picker.tsx`
- [ ] `recipe-form-layout.tsx`
- [ ] `use-create-recipe.ts`
- [ ] Rewrite `create-recipe-screen.tsx`
- [ ] Screen smoke test

### Docs + CI

- [ ] `docs/deployment-guide.md` R2 section
- [ ] `.env.example` stubs
- [ ] GHA secrets added
- [ ] `docs/project-changelog.md` Slice 3
- [ ] All tests + lint green
- [ ] Commit: `feat(recipes): create recipe flow + R2 image upload`

## Success Criteria

- [ ] From mobile: pick image → see preview → fill form → submit → detail screen shows new recipe
- [ ] Uploaded image URL opens in browser (public-read)
- [ ] **MANDATORY real-R2 smoke test**: manual upload 1 jpeg via dev BE → real R2 → public URL opens in browser; screenshot + URL logged in PR description
- [ ] iPhone-portrait capture renders upright (EXIF orientation honored)
- [ ] SVG upload attempt rejected with 415 (tested manually + unit)
- [ ] Polyglot file (GIF-wrapped-PHP) rejected with 415
- [ ] Retry on network flake does NOT create duplicate R2 object (X-Upload-Id idempotency)
- [ ] Orphan upload (no recipe linked after 24h) cleaned up by janitor
- [ ] Recipe delete removes R2 object
- [ ] Foreign imageUrl (non-R2 domain) on recipe create → 400
- [ ] Ingredient autocomplete returns matches after 2+ chars
- [ ] Draft save works; draft not shown in public feed
- [ ] Over-limit upload (>5MB) rejected with clear error
- [ ] Rate limit triggers after 20 uploads/hour
- [ ] New BE tests pass; mobile tests + new pass; no regression
- [ ] Axios error logs contain no Bearer tokens (unit verified)
- [ ] `.env` not committed; GHA secrets wired

## Risk Assessment

| Risk                                                             | Likelihood | Impact   | Mitigation                                                                                              |
| ---------------------------------------------------------------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------- |
| R2 credentials leak                                              | Medium     | **High** | env-only, GHA secrets, pre-commit scan, never log credentials, `.gitignore` verified, axios error scrub |
| LocalStack/MinIO differs from R2 (ACL behavior)                  | High       | **High** | Real-R2 smoke test MANDATORY in Success Criteria; R2Service code comment on ACL limitation              |
| Malicious polyglot image uploaded (JPEG-wrapped-PHP)             | Medium     | **High** | Tika content MIME detect + ImageIO re-encode + SVG exclusion                                            |
| Client lies about MIME via header                                | High       | **High** | Server-side Tika detection on byte content, ignore client header                                        |
| Orphan R2 objects accumulate (user abandons form after upload)   | High       | Medium   | pending_uploads + daily janitor cron + TTL index                                                        |
| Duplicate R2 objects from network retry                          | Medium     | Medium   | X-Upload-Id header idempotency                                                                          |
| Recipe deletion leaves orphan R2 image                           | High       | Medium   | Recipe delete hook calls R2.deleteObject                                                                |
| Foreign imageUrl SSRF / hotlink abuse                            | Medium     | Medium   | `@Pattern` regex on imageUrl pinned to R2 bucket                                                        |
| Client resize fails on weird HEIC/unusual formats                | Medium     | Medium   | Reject non-JPEG/PNG/WEBP client-side too; fallback error message                                        |
| EXIF orientation causes sideways rotated uploads                 | High       | Medium   | Explicit rotate-before-resize pipeline (Step 25) + fixture test                                         |
| Multipart proxy timeout on slow network                          | Low        | Medium   | Axios timeout 30s; show upload progress; retry button (safe via idempotency)                            |
| OOM under concurrent multipart uploads                           | Medium     | High     | `file-size-threshold=0` forces disk-buffering                                                           |
| Bearer token leaks in error logs / Sentry                        | Medium     | High     | Axios error scrub interceptor + unit test                                                               |
| Seed data conflicts with existing dev DB / concurrent boot races | Medium     | Low      | Unique index on name + per-item upsert (idempotent)                                                     |
| Form screen >200 LOC                                             | Medium     | Low      | Already planned sub-components; enforce in review                                                       |
| `expo-image-picker` perms denied                                 | Medium     | Low      | Clear permission prompt with fallback message                                                           |
| Ingredient catalog too small, autocomplete useless               | Medium     | Medium   | 150+ items; easy to expand via JSON re-seed later                                                       |

## Security Considerations

- **R2 credentials**: BE-only, never shipped to mobile. Mobile uploads via BE proxy (no direct R2 write from client).
- **Upload endpoint**:
  - JWT required
  - **Content-detected MIME via Apache Tika** (whitelist jpeg/png/webp only); NEVER trust `MultipartFile.getContentType()` (client-controlled)
  - **SVG permanently excluded** (XSS / XML external entity risks) — explicit unit test
  - **ImageIO re-encode** strips EXIF + metadata, rejects polyglot files (`ImageIO.read` returns null → reject)
  - Size ≤5MB (enforced at Spring multipart layer + post-parse)
  - Multipart `file-size-threshold=0` forces disk-buffering to prevent OOM on concurrent uploads
  - Filename sanitized (UUID only, no user input in key)
  - Object metadata: `Content-Disposition: attachment` + `X-Content-Type-Options: nosniff`
- **R2 ACL**: R2 does NOT accept S3 canned ACLs; `putObject` MUST NOT pass ACL param. Public access is bucket-level via `pub-xxx.r2.dev` subdomain.
- **R2 bucket**: public-read for objects only (bucket setting); no list/write public. Write via API token scoped to this bucket only.
- **Rate limit**: 20 uploads/hour/user via Bucket4j.
- **Idempotency**: `X-Upload-Id` header dedupes retries so network flake doesn't produce duplicate R2 objects.
- **Orphan cleanup**: pending_uploads with `linkedToRecipeId IS NULL` + age >24h deleted by daily janitor → zero orphan cost.
- **Recipe imageUrl validation**: `@Pattern` regex pinned to `${R2_PUBLIC_URL}/<uuid>.<ext>` — blocks SSRF / foreign-host hotlinks / attribution scraping.
- **Recipe create**: `RecipeService.create` must set `authorId = authenticatedUser.id` — never trust client-supplied author.
- **PendingUpload ownership**: recipe create re-checks `pendingUpload.userId == principal.id` to prevent using another user's orphan upload URL.
- **Ingredient autocomplete**: public GET OK; ensure no sensitive fields leak in response.
- **Ingredient unique index**: `@Indexed(unique = true)` on `name` prevents duplicate seeding races.
- **Input validation**: `@Pattern` difficulty + imageUrl, `@Size` cuisine/title/description, Zod mirror on mobile.
- **Axios error scrub**: interceptor strips `Authorization`, `Cookie`, and multipart form body from error objects BEFORE any console/Sentry emission — prevents token leak in crash reports.
- **Logs**: never log full R2 URLs with tokens; never log multipart file bytes; never log request headers without scrubbing.

## Rollback Plan

- **BE revert**: delete `upload/` package + remove SDK dep. Pre-existing recipe endpoints unaffected.
- **R2 bucket**: leave; no cost for empty.
- **Seed data**: if seeder ran in prod accidentally, leaves ingredients — harmless.
- **Mobile revert**: create-recipe screen reverts to stub; uninstall expo packages if undesired.

## Next Steps

- Independent of Slice 4 — can run parallel if bandwidth permits.
- Post-merge: monitor R2 usage (Cloudflare dashboard) for first week.
- Future: migrate to presigned URL flow if BE bandwidth becomes bottleneck.
- Future: add image CDN/transforms (Cloudflare Images) if needed.
