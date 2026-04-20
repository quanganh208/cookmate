---
title: 'Phase 4 — Mobile Recipes Wire-up'
description: 'Ship 4 vertical slices wiring mobile to BE recipes/search/upload/favorites; delete mocks; add missing BE endpoints.'
status: pending
priority: P1
phase: 4
scope: mobile-recipes
date: 2026-04-20
slices: 4
estimate: '16-22 days (post-red-team)'
branch: main
tags: [mobile, backend, recipes, search, upload, favorites, r2]
created: 2026-04-20
---

# Phase 4 — Mobile Recipes Implementation

## Executive Summary

BE controllers shipped ~60% (recipes/ingredients/collections/interactions). Mobile screens are 25–90 LOC stubs + detail on mock. Goal: 4 vertical slices wire mobile → real BE, delete mocks, add missing BE (`/api/recipes/search`, `/api/uploads/image`, favorites helpers). Quality-first: each slice ends with tests + lint + no regression.

## Context Links

- **Brainstorm**: [/Volumes/QUANGANH1TB/Coding/cookmate/plans/reports/brainstorm-260420-0945-phase-4-mobile-recipes.md](../reports/brainstorm-260420-0945-phase-4-mobile-recipes.md)
- **Docs**: [docs/development-roadmap.md](../../docs/development-roadmap.md), [docs/system-architecture.md](../../docs/system-architecture.md), [docs/code-standards.md](../../docs/code-standards.md)
- **Reference features**: `apps/mobile/features/auth/` (structure template)

## Locked Decisions (from brainstorm)

D1 vertical slices · D2 Detail→Search→Create→Saved · D3 Cloudflare R2 · D4 multipart proxy · D5 Collection "Favorites" auto-create · D6 MongoDB `$text` · D7 ingredient autocomplete · D8 R2 public-read · D9 client resize 1280px/80%/≤5MB · D10 useInfiniteQuery.

## Phases

| #   | Phase                                | File                                                                     | Estimate | Status   |
| --- | ------------------------------------ | ------------------------------------------------------------------------ | -------- | -------- |
| 4.1 | Recipe Detail + wire format fix      | [phase-04-1-recipe-detail.md](phase-04-1-recipe-detail.md)               | 3–5d     | complete |
| 4.2 | Search (BE endpoint + mobile screen) | [phase-04-2-search.md](phase-04-2-search.md)                             | 3–4d     | complete |
| 4.3 | Create Recipe + R2 Upload + janitor  | [phase-04-3-create-recipe-upload.md](phase-04-3-create-recipe-upload.md) | 7–9d     | pending  |
| 4.4 | Favorites (Collection-based)         | [phase-04-4-favorites.md](phase-04-4-favorites.md)                       | 3–4d     | pending  |

## Dependencies

- **Slice 1 blocks all**: fixes `ApiResponseEnvelope<Page<T>>` wire format + types. Slices 2/3/4 depend on aligned repo + hooks pattern.
- **Slices 2/3/4 independent** after Slice 1 (different features/files).
- **Slice 3 prerequisite (manual, user)**: Cloudflare R2 bucket + API token + public domain + env/GHA secrets (documented in phase-04-3).
- **Slice 3 sub-task**: Ingredient seed data (100–200 items) before autocomplete.

## Global Success Criteria

- [ ] 4 screens show real BE data, zero mocks
- [ ] Create recipe E2E: form → image → save → appears in feed
- [ ] Search returns correct full-text results
- [ ] Save/unsave toggle + Favorites screen persist via BE
- [ ] 18/18 mobile tests + 61/61 backend tests stay green (+ new tests per slice)
- [ ] Lint + format clean on every slice
- [ ] `docs/development-roadmap.md` + `docs/project-changelog.md` updated after Slice 1 and at Phase 4 completion

## Global Risk Summary

| Risk                                    | Severity | Mitigation                                             |
| --------------------------------------- | -------- | ------------------------------------------------------ |
| R2 credential leak                      | High     | env-only, GHA secrets, pre-commit scan                 |
| Wire format mismatch persists           | High     | Slice 1 gates all; unit tests on envelope unwrap       |
| MongoDB `$text` Vietnamese tokenization | Medium   | TextIndex `language:'none'` + regex fallback           |
| Client image >5MB                       | Medium   | expo-image-manipulator resize 1280px/80% before upload |
| Favorites race                          | Low      | Upsert + idempotent endpoints                          |

## Unresolved Questions (logged, not blocking)

- **Q1**: ~~`RecipeImageUpload` orphan-cleanup model~~ → **RESOLVED via red-team**: uploadId idempotency + 24h scheduled janitor (Phase 4.3 Finding #4).
- **Q2**: Step-level images (tutorial photos) → Phase 5.
- **Q3**: Cuisine/difficulty enum vs free-text → add `@Pattern` validation in Slice 3.
- **Q4**: Deep link `cookmate://recipe/{id}` → out of scope Phase 4.
- **Q5**: Draft recipes MMKV persistence → optional stretch in Slice 3.
- **Q6** (deferred): Mobile/BE version skew (`X-Mobile-Version` header + min-version gate) → Phase 5+.

## Red Team Review

### Session — 2026-04-20

**Reviewers**: Security Adversary · Assumption Destroyer · Failure Mode Analyst (3 parallel, code-reviewer agent)
**Findings**: 30 raw → 21 after dedup (15 top + 6 notable). **Disposition**: 20 accepted, 1 deferred.
**Severity breakdown**: 3 Critical · 8 High · 4 Medium · 6 Notable · 1 Deferred.

| #   | Finding                                                               | Severity | Disposition | Applied To                                                                               |
| --- | --------------------------------------------------------------------- | -------- | ----------- | ---------------------------------------------------------------------------------------- |
| 1   | Polyglot image bypass — no magic-byte check, no server re-encode      | Critical | Accept      | phase-04-3 §Security + §Upload validation                                                |
| 2   | `recipes-repository.list()` breaking change w/o caller audit          | Critical | Accept      | phase-04-1 §Steps (new audit step)                                                       |
| 3   | R2 ACL myth — Cloudflare R2 doesn't honor S3 canned ACL               | Critical | Accept      | phase-04-3 §Architecture (R2Service signature)                                           |
| 4   | R2 orphan accumulation (public bucket + no cleanup + no idempotency)  | High     | Accept      | phase-04-3 §Upload flow (uploadId) + new §Janitor                                        |
| 5   | SSRF/XSS via client-supplied `imageUrl` (no prefix validation)        | High     | Accept      | phase-04-3 §BE create validation                                                         |
| 6   | Favorites race + legacy migration + delete guard missing              | High     | Accept      | phase-04-4 §Part A (unique index + upsert + delete guard)                                |
| 7   | Spring Data derived query `findBy(TextCriteria, Pageable)` impossible | High     | Accept      | phase-04-2 §Step 1 (custom repo impl)                                                    |
| 8   | Text index language change needs explicit migration                   | High     | Accept      | phase-04-2 §MongoIndexMigration                                                          |
| 9   | MinIO ≠ R2 → no real-R2 smoke test mandated                           | High     | Accept      | phase-04-3 §Success Criteria                                                             |
| 10  | EXIF orientation stripped → iOS portrait sideways                     | High     | Accept      | phase-04-3 §resize-image util + fixture                                                  |
| 11  | Collection.entries N+1 + `viewCount` inflation                        | High     | Accept      | phase-04-4 §Part B (new `/favorites/recipes` endpoint) + RecipeController viewCount gate |
| 12  | Reserved-name bypass (ZWSP, trim, homoglyphs, locale variants)        | Medium   | Accept      | phase-04-4 §Part A step 3 (NFKC + blocklist)                                             |
| 13  | Search/favorites rate limit + unbounded Pageable size                 | Medium   | Accept      | phase-04-2 + phase-04-4 §Security                                                        |
| 14  | Favorites `contains` oracle + no visibility check on addRecipe        | Medium   | Accept      | phase-04-4 §Part B (status check + 404 on invisible)                                     |
| 15  | Multipart memory bomb (`byte[]` signature)                            | Medium   | Accept      | phase-04-3 §R2Service (InputStream + contentLength) + application.yml                    |
| 16  | JWT in axios error logs                                               | Notable  | Accept      | phase-04-3 §Mobile upload client (scrub interceptor)                                     |
| 17  | MMKV recent searches not user-scoped, unencrypted, no try/catch       | Notable  | Accept      | phase-04-2 §MMKV (userId scope + cryptKey + logout clear)                                |
| 18  | `RecipeCardCompact` shape drift after `Recipe` retype                 | Notable  | Accept      | phase-04-1 §Steps (card shape audit)                                                     |
| 19  | CI Docker/Testcontainer prerequisite unverified                       | Notable  | Accept      | phase-04-2 §Prerequisites (CI audit)                                                     |
| 20  | `IngredientSeeder` race + no unique index                             | Notable  | Accept      | phase-04-3 §Part C (unique index + per-item upsert)                                      |
| 21  | Mock deletion Metro cache + e2e fixture audit                         | Notable  | Accept      | phase-04-1 §Steps (Metro clear + fixture grep)                                           |
| —   | Mobile/BE version skew                                                | Deferred | Reject      | → Q6 Phase 5+                                                                            |

## Validation Log

### Session 1 — 2026-04-20

**Trigger:** Post-red-team validation interview (`/ck:plan validate`).
**Questions asked:** 7

#### Questions & Answers

1. **[Architecture]** Impl `/api/collections/favorites/recipes` — truy vấn cách nào?
   - Options: Batch findAllByIdIn (Recommended) | $lookup aggregation
   - **Answer:** Batch findAllByIdIn (2 queries)
   - **Rationale:** KISS + hobby pace; $lookup overkill cho user có ~50 favorites.

2. **[Architecture]** incrementViewCount — xử lý sao sau F11?
   - Options: `?view=false` query param default true (Recommended) | Remove + separate POST /recipes/{id}/view | Keep + accept inflation
   - **Answer:** `?view=false` query param default true
   - **Rationale:** Backward compat giữ existing callers; batch path (favorites) set view=false explicit.

3. **[Risk]** Legacy Collection 'Favorites' migration strategy?
   - Options: Opportunistic self-heal on first read (Recommended) | Fail-fast at boot | Ignore + skip index
   - **Answer:** Opportunistic self-heal + fail-loud on index creation dup
   - **Rationale:** Unique index enforces correctness. If duplicates exist, boot fails with dedup instructions — explicit > silent.

4. **[Assumptions]** Bucket4j cho rate limiting — add ngay?
   - Options: Verify first, add if missing (Recommended) | Add now | Skip rate limit
   - **Answer:** Verify during Slice 4.2 Prerequisites
   - **Rationale:** Phase 3.5 may already use Bucket4j or in-memory map; read pom.xml first to avoid redundant dep.

5. **[Scope]** Ingredient seed list source?
   - Options: Curated JSON 150 items committed (Recommended) | Open dataset import | Start empty
   - **Answer:** Curated JSON 150 items in `backend/src/main/resources/seed/ingredients.json`
   - **Rationale:** Vietnamese + international staples; version-controlled; seeder reads once.

6. **[Architecture]** Slice branch strategy?
   - Options: 1 branch per slice (Recommended) | 1 branch for whole Phase 4 | Direct to main
   - **Answer:** 1 branch per slice (e.g. `feat/phase-4-1-recipe-detail`)
   - **Rationale:** Independent CI per slice; easy rollback; incremental code review.

7. **[Risk]** R2 SDK v2 Content-Disposition / X-Content-Type-Options support?
   - Options: Verify during Prerequisites (Recommended) | Skip, trust MIME re-encode
   - **Answer:** Verify during Phase 4.3 Prerequisites; fallback to Cloudflare Transform Rules if SDK doesn't support per-object
   - **Rationale:** Defense-in-depth for polyglot prevention; document findings in phase file.

#### Confirmed Decisions (propagated to phases)

| #   | Decision                                                                                       | Target Phase             |
| --- | ---------------------------------------------------------------------------------------------- | ------------------------ |
| V1  | Favorites endpoint uses `findAllByIdIn` batch (2 queries)                                      | phase-04-4               |
| V2  | `incrementViewCount` gated via `?view=false` query param (default true)                        | phase-04-1 + phase-04-4  |
| V3  | Legacy Favorites: opportunistic self-heal + fail-loud on index dup                             | phase-04-4               |
| V4  | Bucket4j verify in pom.xml before Slice 4.2                                                    | phase-04-2 Prerequisites |
| V5  | Ingredient seed JSON at `backend/src/main/resources/seed/ingredients.json` (150 items VN+intl) | phase-04-3               |
| V6  | 1 branch per slice; PR + merge before next slice                                               | plan.md (workflow note)  |
| V7  | Verify R2 SDK metadata support in Phase 4.3 Prerequisites; document                            | phase-04-3 Prerequisites |

#### Recommendation: **PROCEED**. No further validation needed.

## Workflow Notes

- **Branching**: 1 branch per slice. Naming: `feat/phase-4-{n}-{slug}` (e.g. `feat/phase-4-1-recipe-detail`). PR → review → merge `main` → start next slice.
- **Rollback unit**: slice-scoped. Each slice self-contained; merge-back reverts one slice without affecting others.
- **CI**: each slice PR runs full test suite (mobile + backend). Red on any existing test = block merge.
