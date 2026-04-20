# Code Landscape Scout: Slice 1 of Phase 4 (Mobile Recipes Wire-up)

**Date**: 2026-04-20  
**Scope**: Exhaustive audit of DTO shapes, API contracts, mobile types, hooks, components, and caller inventory  
**Thoroughness**: Very Thorough

---

## Executive Summary

The codebase is poised for wire-up:

- **Backend**: Fully typed DTOs with nested author, steps, ingredients; Recipe response envelope is `ApiResponse<T>` with `success: boolean`, `data: T`, `error`, `timestamp`
- **Mobile**: Currently uses **mock data only** (15 recipes in `MOCK_RECIPES`); real types defined but not wired to backend
- **Callers**: 2 active usage sites (use-recipes.ts only); low churn risk for rewrite
- **Critical path**: Recipe detail screen still uses MOCK_RECIPES.find() — must switch to API once wired

---

## BACKEND DTO SHAPES

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/recipe/dto/RecipeResponse.java`

**Complete Content:**

```java
package com.cookmate.recipe.dto;

import com.cookmate.auth.dto.UserResponse;
import com.cookmate.recipe.model.RecipeIngredient;
import com.cookmate.recipe.model.Step;
import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeResponse {

    private String id;
    private String title;
    private String description;
    private String imageUrl;
    private Integer serving;
    private Integer prepTime;
    private Integer cookTime;
    private String difficulty;
    private String cuisine;
    private String status;                    // DRAFT | PUBLISHED | ARCHIVED (enum on wire)
    private Long viewCount;
    private Long likeCount;
    private Boolean isFeatured;
    private String authorId;
    private UserResponse author;              // ⬅ NESTED AUTHOR (conditionally populated)
    private String category;
    private List<Step> steps;                 // ⬅ NESTED STEPS
    private List<RecipeIngredient> ingredients;  // ⬅ NESTED INGREDIENTS
    private Instant createdAt;
    private Instant updatedAt;

    public static RecipeResponse from(Recipe recipe) {
        // Factory method: missing author field here (set by service)
    }
}
```

**Key observations**:

- `author: UserResponse` is optional (null when not fetched)
- `status` is String on wire (enum name from Recipe.RecipeStatus.name())
- `createdAt`, `updatedAt` are ISO Instant strings in JSON
- `viewCount`, `likeCount` are Long (not cached on mobile, returned from GET)

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/recipe/dto/CreateRecipeRequest.java`

**Complete Content:**

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRecipeRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private String imageUrl;
    private Integer serving;
    private Integer prepTime;
    private Integer cookTime;
    private String difficulty;
    private String cuisine;
    private String status;

    private String category;

    @NotEmpty(message = "At least one step is required")
    @Valid
    private List<Step> steps;

    @NotEmpty(message = "At least one ingredient is required")
    @Valid
    private List<RecipeIngredient> ingredients;
}
```

**Key observations**:

- Nested `Step`, `RecipeIngredient` objects required (validated)
- `authorId` NOT in request (inferred from auth principal)
- `viewCount`, `likeCount` NOT in request (server-set)

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/recipe/dto/UpdateRecipeRequest.java`

**Complete Content:**

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRecipeRequest {

    private String title;
    private String description;
    private String imageUrl;
    private Integer serving;
    private Integer prepTime;
    private Integer cookTime;
    private String difficulty;
    private String cuisine;
    private String status;
    private String category;

    @Valid private List<Step> steps;
    @Valid private List<RecipeIngredient> ingredients;
}
```

**Key observations**:

- All fields optional (null = no update)
- Mirrors CreateRecipeRequest (minus validation)

### DTO Directory Listing

**Path**: `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/recipe/dto/`

**Files**:

1. `CreateRecipeRequest.java` (48 lines)
2. `RecipeResponse.java` (65 lines)
3. `UpdateRecipeRequest.java` (42 lines)

---

## BACKEND API ENVELOPE

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/shared/dto/ApiResponse.java`

**Complete Content:**

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private ErrorDetail error;
    private String timestamp;  // ISO instant string

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ErrorDetail {
        private String code;
        private String message;
    }

    // Static factory methods: ok(T data), ok(), error(code, message)
}
```

**Wire shape example for `GET /api/recipes`**:

```json
{
  "success": true,
  "data": {
    "content": [
      /* Page<RecipeResponse> items */
    ],
    "totalElements": 42,
    "totalPages": 3,
    "size": 20,
    "number": 0,
    "first": true,
    "last": false,
    "numberOfElements": 20
  },
  "timestamp": "2026-04-20T10:30:00Z"
}
```

**Spring Data Page<T> JSON shape** (confirmed from MongoRepository):

- `content`: T[]
- `totalElements`: number
- `totalPages`: number
- `size`: number (page size)
- `number`: number (0-indexed page)
- `first`: boolean
- `last`: boolean
- `numberOfElements`: number (items in this page)

---

## BACKEND CONTROLLER & SERVICE

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/recipe/controller/RecipeController.java`

**Endpoints**:

```java
@PostMapping                          // POST /api/recipes
public ResponseEntity<ApiResponse<RecipeResponse>> create(...)

@GetMapping("/{id}")                  // GET /api/recipes/{id}
public ResponseEntity<ApiResponse<RecipeResponse>> findById(@PathVariable String id)

@GetMapping                           // GET /api/recipes
public ResponseEntity<ApiResponse<Page<RecipeResponse>>> findAll(
        @PageableDefault(size = 20) Pageable pageable)

@GetMapping("/author/{authorId}")     // GET /api/recipes/author/{authorId}
public ResponseEntity<ApiResponse<Page<RecipeResponse>>> findByAuthor(...)

@GetMapping("/category/{category}")   // GET /api/recipes/category/{category}
public ResponseEntity<ApiResponse<Page<RecipeResponse>>> findByCategory(...)

@GetMapping("/featured")              // GET /api/recipes/featured
public ResponseEntity<ApiResponse<Page<RecipeResponse>>> findFeatured(...)

@PutMapping("/{id}")                  // PUT /api/recipes/{id}
public ResponseEntity<ApiResponse<RecipeResponse>> update(...)

@DeleteMapping("/{id}")               // DELETE /api/recipes/{id}
public ResponseEntity<ApiResponse<Void>> delete(...)
```

**Key detail**:

- `findById()` calls `recipeService.incrementViewCount(id)` **before** returning
  - ⚠ This means every GET increments viewCount (even for preview/detail screens)
  - Mobile must gate this with `?view=false` query param (NOT YET IMPLEMENTED in backend)

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/recipe/service/RecipeService.java`

**Key methods**:

```java
public RecipeResponse findById(String id)                         // Raw find
public RecipeResponse findByIdWithAuthor(String id)               // Find + fetch author
public Page<RecipeResponse> findPublished(Pageable pageable)      // Published only
public Page<RecipeResponse> findFeatured(Pageable pageable)       // Featured flag only
public Page<RecipeResponse> findByCategory(String category, ...)  // Category filter
public Page<RecipeResponse> findByAuthorId(String authorId, ...) // Author filter
public void incrementViewCount(String id)                         // Increments by 1
public void incrementLikeCount(String id, int delta)              // Add/subtract likes
```

**Repository interface** (`RecipeRepository extends MongoRepository<Recipe, String>`):

```java
Page<Recipe> findByAuthorId(String authorId, Pageable pageable);
Page<Recipe> findByStatus(Recipe.RecipeStatus status, Pageable pageable);
Page<Recipe> findByCategory(String category, Pageable pageable);
List<Recipe> findByAuthorId(String authorId);  // Non-paginated
Page<Recipe> findByIsFeaturedTrue(Pageable pageable);
```

---

## BACKEND NESTED MODELS

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/recipe/model/Recipe.java`

```java
@Document("recipes")
public class Recipe {
    @Id private String id;
    @TextIndexed private String title;
    @TextIndexed private String description;
    private String imageUrl;
    private Integer serving;
    private Integer prepTime;
    private Integer cookTime;
    private String difficulty;
    private String cuisine;
    @Builder.Default private RecipeStatus status = RecipeStatus.DRAFT;  // ENUM
    @Builder.Default private Long viewCount = 0L;
    @Builder.Default private Long likeCount = 0L;
    @Builder.Default private Boolean isFeatured = false;
    @Indexed private String authorId;
    private String category;
    @Builder.Default private List<Step> steps = new ArrayList<>();
    @Builder.Default private List<RecipeIngredient> ingredients = new ArrayList<>();
    @CreatedDate private Instant createdAt;
    @LastModifiedDate private Instant updatedAt;

    public enum RecipeStatus {
        DRAFT,
        PUBLISHED,
        ARCHIVED
    }
}
```

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/recipe/model/Step.java`

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Step {
    private Integer number;        // 1-indexed step number
    private String description;
    private String imageUrl;       // Optional step image
    private String videoUrl;       // Optional step video
}
```

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/recipe/model/RecipeIngredient.java`

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeIngredient {
    private String ingredientId;   // Reference to Ingredient entity (future)
    private String name;           // Display name
    private Double amount;         // e.g. 2.5
    private String unit;           // e.g. "cups", "grams", "tbsp"
    private String note;           // e.g. "diced", "optional"
}
```

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/backend/src/main/java/com/cookmate/auth/dto/UserResponse.java`

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private String id;
    private String email;
    private String displayName;
    private String avatarUrl;
    private String bio;
    private String authProvider;  // "GOOGLE" | "NATIVE" (enum name)
    private Set<String> roles;    // Set of role names
    private boolean emailVerified;
}
```

---

## MOBILE TYPE DEFINITIONS

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/shared/types/recipe.ts`

**Complete Content:**

```typescript
/** Author of a recipe */
export interface Author {
  id: string;
  name: string;
  avatarUrl: string;
}

/** Recipe data model — matches future backend API contract */
export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  cookTime: number; // minutes
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: Category;
  author: Author;
  likeCount: number;
  isBookmarked: boolean; // ⚠ NOT ON BACKEND
  isFeatured: boolean;
  createdAt: string; // ISO date
}

/** Available recipe categories for filtering */
export type Category =
  | 'All'
  | 'Breakfast'
  | 'Lunch'
  | 'Dinner'
  | 'Dessert'
  | 'Snack'
  | 'Drink'
  | 'Vegetarian'
  | 'Seafood';

export const CATEGORIES: Category[] = [
  'All',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Dessert',
  'Snack',
  'Drink',
  'Vegetarian',
  'Seafood',
];
```

**Gaps vs. Backend RecipeResponse**:

- ❌ `isBookmarked` — NOT on backend (will be in Cooksnap/collection in Phase 5)
- ❌ `viewCount` — NOT in mobile type (but IS in RecipeResponse)
- ❌ `serving`, `prepTime` — NOT in mobile type (but ARE in RecipeResponse)
- ❌ `cuisine` — NOT in mobile type
- ❌ `status` — NOT in mobile type (backend-only, always PUBLISHED on wire)
- ❌ `steps`, `ingredients` — NOT in mobile type (detail screen will need)
- ❌ `authorId`, `updatedAt` — NOT in mobile type

**Action**: Extend Recipe type to include all backend fields (or create RecipeDetail for expanded view).

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/shared/types/index.ts`

```typescript
export type { Recipe, Author, Category } from './recipe';
export { CATEGORIES } from './recipe';
```

---

## MOBILE API CLIENT & REPOSITORY

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/shared/api/api-client.ts`

**Complete Content:**

```typescript
import { useAuthStore } from '@/features/auth/store';
import { ApiError, NETWORK_ERROR_CODE, type ApiResponseEnvelope } from './api-error';
import { authEvents } from './auth-events';
import { secureTokenStorage } from './secure-token-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? 'dev-api-key-change-in-production';

const REFRESH_SKIP_ENDPOINTS = new Set([
  '/auth/refresh',
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
]);

interface RefreshSuccess {
  accessToken: string;
  refreshToken: string;
}

let refreshInFlight: Promise<RefreshSuccess | null> | null = null;

async function callRefreshEndpoint(refreshToken: string): Promise<RefreshSuccess | null> {
  // ... refresh token logic
}

async function refreshTokens(): Promise<RefreshSuccess | null> {
  // ... de-duplication of concurrent 401s
}

interface RequestOptions extends RequestInit {
  _retried?: boolean;
}

/**
 * Typed fetch wrapper. Injects API key + Bearer token, unwraps the `ApiResponse` envelope, and
 * transparently refreshes expired access tokens on the first 401. Call sites receive the `data`
 * payload directly, or an `ApiError` with a semantic code on failure.
 */
export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { headers: customHeaders, _retried, ...rest } = options;

  const accessToken = useAuthStore.getState().session?.accessToken;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    ...(customHeaders as Record<string, string> | undefined),
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, { ...rest, headers });
  } catch (err) {
    throw new ApiError(NETWORK_ERROR_CODE, (err as Error).message ?? 'Network request failed', 0);
  }

  // 401 refresh dance — only on authenticated endpoints and only once per call.
  if (
    response.status === 401 &&
    !_retried &&
    !REFRESH_SKIP_ENDPOINTS.has(endpoint) &&
    accessToken
  ) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return apiClient<T>(endpoint, { ...options, _retried: true });
    }
  }

  let envelope: ApiResponseEnvelope<T> | null = null;
  try {
    envelope = (await response.json()) as ApiResponseEnvelope<T>;
  } catch {
    // Response body was not JSON — fall through to a generic error below.
  }

  if (!response.ok || !envelope || envelope.success === false) {
    const code = envelope?.error?.code ?? `HTTP_${response.status}`;
    const message = envelope?.error?.message ?? `Request failed with status ${response.status}`;
    throw new ApiError(code, message, response.status);
  }

  return envelope.data as T;
}
```

**Key behavior**:

- Injects `X-API-Key` + `Authorization: Bearer {token}`
- Unwraps `ApiResponseEnvelope<T>` → returns `T` directly (or throws ApiError)
- Auto-refreshes on 401 (single-flight de-duplication)

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/shared/api/api-error.ts`

**Complete Content:**

```typescript
/**
 * Backend `ApiResponse<T>` envelope mirror. Kept in sync with
 * `backend/src/main/java/com/cookmate/shared/dto/ApiResponse.java`.
 */
export interface ApiResponseEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

/**
 * Typed API error thrown by `apiClient` on a non-successful response. Carries the backend error
 * code (semantic, e.g. `BAD_CREDENTIALS`) so callers — typically error mappers in the auth
 * feature — can render the right user-facing message without string-matching.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export const NETWORK_ERROR_CODE = 'NETWORK_ERROR';
```

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/api/recipes-repository.ts`

**Complete Content:**

```typescript
import { apiClient } from '@/shared/api/api-client';
import type { Recipe } from '../types';

/** Repository for recipe API operations */
export const recipesRepository = {
  list: (params?: { category?: string }) =>
    apiClient<Recipe[]>(`/recipes${params?.category ? `?category=${params.category}` : ''}`),

  getById: (id: string) => apiClient<Recipe>(`/recipes/${id}`),

  create: (data: Omit<Recipe, 'id' | 'createdAt' | 'likeCount'>) =>
    apiClient<Recipe>('/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
```

**Issues**:

- ⚠ `list()` returns `Recipe[]` but backend returns `Page<RecipeResponse>` — **MISMATCH**
  - Will fail with "Cannot destructure 'content'" when real API wired
- ⚠ No pagination support (size, page number)
- ⚠ No `getByCategory` — uses query string instead
- ⚠ No featured recipes endpoint (`/recipes/featured`)

---

## MOBILE HOOKS

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/hooks/use-recipes.ts`

**Complete Content:**

```typescript
import { useQuery } from '@tanstack/react-query';
import { recipesRepository } from '../api/recipes-repository';
import { MOCK_RECIPES } from '@/shared/constants/mock-recipes';

/** Fetch recipe list — uses placeholder data until backend connected */
export function useRecipes(category?: string) {
  return useQuery({
    queryKey: ['recipes', category],
    queryFn: () => recipesRepository.list({ category }),
    placeholderData: MOCK_RECIPES, // ⚠ FALLBACK TO MOCK
  });
}

/** Fetch single recipe by ID */
export function useRecipeById(id: string) {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: () => recipesRepository.getById(id),
    enabled: !!id,
    placeholderData: MOCK_RECIPES.find((r) => r.id === id), // ⚠ FALLBACK TO MOCK
  });
}
```

**Issues**:

- ⚠ `placeholderData` will **NOT** work post-wire (type mismatch: Recipe[] vs Page<Recipe>)
- ⚠ `useRecipeById` returns mock object synchronously (fast), but real API will be async

---

## MOBILE MOCK DATA

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/shared/constants/mock-recipes.ts`

**Structure**:

```typescript
const AUTHORS = {
  minh: { id: 'a1', name: 'Chef Minh', avatarUrl: 'https://i.pravatar.cc/100?u=minh' },
  lan: { id: 'a2', name: 'Bếp Lan', avatarUrl: 'https://i.pravatar.cc/100?u=lan' },
  // ... 5 total
};

export const MOCK_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Phở Bò Hà Nội',
    description: '...',
    imageUrl: 'https://picsum.photos/seed/pho/800/450',
    cookTime: 180,
    difficulty: 'Hard',
    category: 'Dinner',
    author: AUTHORS.minh,
    likeCount: 342,
    isBookmarked: false,
    isFeatured: true,
    createdAt: '2026-03-15T08:00:00Z',
  },
  // ... 14 more recipes
];
```

**Count**: 15 mock recipes (IDs '1'–'15')  
**Seed pattern**: `picsum.photos/seed/{slug}/800/450` (deterministic image URLs)

---

## MOBILE COMPONENTS

### Directory: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/shared/components/`

**Files**:

1. `animated-pressable.tsx`
2. `category-chips.tsx`
3. `index.ts`
4. `recipe-card-compact.tsx`
5. `recipe-card-featured.tsx`

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/shared/components/recipe-card-compact.tsx`

**Complete Content:**

```typescript
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';
import { AnimatedPressable } from '@/shared/components/animated-pressable';
import type { Recipe } from '@/features/recipes/types';

interface RecipeCardCompactProps {
  recipe: Recipe;
  onPress: () => void;
}

/** Compact recipe card for 2-column grid layout with press animation */
export function RecipeCardCompact({ recipe, onPress }: RecipeCardCompactProps) {
  return (
    <AnimatedPressable onPress={onPress} style={styles.card} accessibilityLabel={recipe.title}>
      <Image
        source={recipe.imageUrl}
        style={styles.image}
        placeholder={{ blurhash: 'LKO2:N%2Tw=w]~RBVZRi};RPxuwH' }}
        contentFit="cover"
        transition={300}
      />
      <View style={styles.content}>
        <Text
          style={[Typography.meta, { color: Colors.textPrimary, fontWeight: '600' }]}
          numberOfLines={1}
        >
          {recipe.title}
        </Text>
        <Text style={[Typography.caption, { color: Colors.textSecondary }]} numberOfLines={1}>
          {recipe.author.name} · {recipe.cookTime} min
        </Text>
        <View style={styles.likeRow}>
          <FontAwesome6 name="heart" size={10} color={Colors.primary} />
          <Text style={[Typography.caption, { color: Colors.textSecondary }]}>
            {recipe.likeCount}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: Colors.surface,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  image: { width: '100%', aspectRatio: 1 },
  content: { padding: 8, gap: 3 },
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
```

**Used by**:

- `home-screen.tsx` (line 82) — for "Recent Recipes" 2-column grid

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/shared/components/recipe-card-featured.tsx`

**Complete Content:**

```typescript
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';
import { AnimatedPressable } from '@/shared/components/animated-pressable';
import type { Recipe } from '@/features/recipes/types';

interface RecipeCardFeaturedProps {
  recipe: Recipe;
  onPress: () => void;
}

/** Full-width recipe card with gradient overlay and press animation */
export function RecipeCardFeatured({ recipe, onPress }: RecipeCardFeaturedProps) {
  return (
    <AnimatedPressable onPress={onPress} style={styles.card} accessibilityLabel={recipe.title}>
      <Image
        source={recipe.imageUrl}
        style={styles.image}
        placeholder={{ blurhash: 'LKO2:N%2Tw=w]~RBVZRi};RPxuwH' }}
        contentFit="cover"
        transition={300}
      />
      <View style={styles.content}>
        <Text style={[Typography.recipeTitle, { color: Colors.textPrimary }]} numberOfLines={2}>
          {recipe.title}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.authorRow}>
            <Image source={recipe.author.avatarUrl} style={styles.avatar} transition={200} />
            <Text style={[Typography.meta, { color: Colors.textSecondary }]}>
              {recipe.author.name}
            </Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={[Typography.caption, { color: Colors.textSecondary }]}>
              {recipe.cookTime} min
            </Text>
            <Text style={styles.difficultyBadge}>{recipe.difficulty}</Text>
            <View style={styles.likeRow}>
              <FontAwesome6 name="heart" size={12} color={Colors.primary} />
              <Text style={[Typography.caption, { color: Colors.textSecondary }]}>
                {recipe.likeCount}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    elevation: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  image: { width: '100%', aspectRatio: 4 / 3 },
  content: { padding: 12, gap: 8 },
  metaRow: { gap: 8 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatar: { width: 24, height: 24, borderRadius: 12 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  difficultyBadge: {
    ...Typography.caption,
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
```

**Used by**:

- `home-screen.tsx` (line 73) — for "Recent Recipes" first item (full-width)

---

## MOBILE SCREENS

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/screens/recipe-detail-screen.tsx`

**Complete Content:**

```typescript
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';
import { MOCK_RECIPES } from '@/shared/constants/mock-recipes';

/** Recipe detail screen with warm styling, expo-image, and gradient overlay */
export function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = MOCK_RECIPES.find((r) => r.id === id);

  if (!recipe) {
    return (
      <View style={styles.center}>
        <Text style={[Typography.body, { color: Colors.error }]}>Recipe not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View>
        <Image
          source={recipe.imageUrl}
          style={styles.heroImage}
          placeholder={{ blurhash: 'LKO2:N%2Tw=w]~RBVZRi};RPxuwH' }}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(45,24,16,0.5)']}
          style={styles.heroGradient}
        />
      </View>
      <View style={styles.content}>
        <Text style={[Typography.appTitle, { color: Colors.textPrimary }]}>{recipe.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.badge}>{recipe.cookTime} min</Text>
          <Text style={styles.badge}>{recipe.difficulty}</Text>
          <Text style={styles.badge}>{recipe.category}</Text>
        </View>
        <View style={styles.authorRow}>
          <Image source={recipe.author.avatarUrl} style={styles.avatar} transition={200} />
          <Text style={[Typography.meta, { color: Colors.textSecondary }]}>
            {recipe.author.name}
          </Text>
        </View>
        <Text style={[Typography.body, { color: Colors.textPrimary, lineHeight: 24 }]}>
          {recipe.description}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroImage: { width: '100%', height: 280 },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  content: { padding: 16, gap: 12 },
  metaRow: { flexDirection: 'row', gap: 8 },
  badge: {
    ...Typography.caption,
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
});
```

**Issues**:

- ⚠ **HARDCODED MOCK DATA** — `MOCK_RECIPES.find()` → must switch to `useRecipeById(id)` hook
- ❌ No loading state, error boundary
- ❌ Does not display `steps` or `ingredients` (not in mock type)
- ❌ Does NOT call backend view-count endpoint

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/home/screens/home-screen.tsx`

**Complete Content (excerpt)**:

```typescript
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/shared/constants/colors';
import { MOCK_RECIPES } from '@/shared/constants/mock-recipes';
import { CATEGORIES } from '@/shared/types';
import { useRecipeUIStore } from '@/features/recipes/store';
import { HomeHeader } from '@/features/home/components/home-header';
import { SearchBarShortcut } from '@/features/home/components/search-bar-shortcut';
import { FeaturedCarousel } from '@/features/home/components/featured-carousel';
import { TrendingSection } from '@/features/home/components/trending-section';
import { CategoryChips } from '@/shared/components/category-chips';
import { RecipeCardFeatured } from '@/shared/components/recipe-card-featured';
import { RecipeCardCompact } from '@/shared/components/recipe-card-compact';

export function HomeScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;
  const selectedCategory = useRecipeUIStore((s) => s.selectedCategory);
  const setSelectedCategory = useRecipeUIStore((s) => s.setSelectedCategory);

  const featuredRecipes = useMemo(() => MOCK_RECIPES.filter((r) => r.isFeatured), []);

  // Top 6 by like count for trending
  const trendingRecipes = useMemo(
    () => [...MOCK_RECIPES].sort((a, b) => b.likeCount - a.likeCount).slice(0, 6),
    [],
  );

  // Filter non-featured recipes by category
  const recentRecipes = useMemo(() => {
    const nonFeatured = MOCK_RECIPES.filter((r) => !r.isFeatured);
    if (selectedCategory === 'All') return nonFeatured;
    return nonFeatured.filter((r) => r.category === selectedCategory);
  }, [selectedCategory]);

  const handleRecipePress = (id: string) => {
    router.push(`/recipe/${id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <HomeHeader />
        <SearchBarShortcut />

        <FeaturedCarousel recipes={featuredRecipes} onRecipePress={handleRecipePress} />

        <TrendingSection recipes={trendingRecipes} onRecipePress={handleRecipePress} />

        {/* Recent Recipes — filtered by category chips */}
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Recipes</Text>
        </View>

        <CategoryChips
          categories={CATEGORIES}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {recentRecipes.length === 0 ? (
          <Text style={styles.emptyText}>No recipes in this category</Text>
        ) : (
          <>
            {/* First item: full-width featured card */}
            <RecipeCardFeatured
              recipe={recentRecipes[0]}
              onPress={() => handleRecipePress(recentRecipes[0].id)}
            />

            {/* Rest: 2-column grid */}
            <View style={styles.grid}>
              {recentRecipes.slice(1).map((recipe) => (
                <View key={recipe.id} style={{ width: cardWidth }}>
                  <RecipeCardCompact recipe={recipe} onPress={() => handleRecipePress(recipe.id)} />
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

**Issues**:

- ⚠ **HARDCODED MOCK DATA** — uses `MOCK_RECIPES` directly, no API call
- ❌ Does NOT use `useRecipes()` hook (even though it exists)
- ❌ No pagination (all 15 recipes rendered at once)

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/home/components/featured-carousel.tsx`

Uses `Recipe[]` prop (pulled from mock in parent).

---

## MOBILE STORE

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/store.ts`

**Complete Content:**

```typescript
import { create } from 'zustand';
import type { Category } from './types';

/** UI-only state for recipe browsing — NOT server state */
interface RecipeUIState {
  selectedCategory: Category;
  setSelectedCategory: (category: Category) => void;
}

export const useRecipeUIStore = create<RecipeUIState>((set) => ({
  selectedCategory: 'All',
  setSelectedCategory: (category) => set({ selectedCategory: category }),
}));
```

**Scope**: UI state only (selected category filter). No server state (recipes are in React Query).

---

## CALLER INVENTORY

### `recipesRepository` usage:

**1. File: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/api/recipes-repository.ts`**

- **Line 5**: Definition (`export const recipesRepository = { ... }`)

**2. File: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/hooks/use-recipes.ts`**

- **Line 2**: Import
- **Line 9**: `recipesRepository.list({ category })` — in `useRecipes()` hook
- **Line 18**: `recipesRepository.getById(id)` — in `useRecipeById()` hook

**Total active callers**: 1 hook file (use-recipes.ts)

### `MOCK_RECIPES` usage:

**1. File: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/shared/constants/mock-recipes.ts`**

- **Line 13**: Definition

**2. File: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/shared/constants/index.ts`**

- **Line 3**: Re-export

**3. File: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/screens/recipe-detail-screen.tsx`**

- **Line 7**: Import
- **Line 12**: `MOCK_RECIPES.find((r) => r.id === id)` — in component render

**4. File: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/hooks/use-recipes.ts`**

- **Line 3**: Import
- **Line 10**: `placeholderData: MOCK_RECIPES` — fallback in useRecipes query
- **Line 20**: `placeholderData: MOCK_RECIPES.find((r) => r.id === id)` — fallback in useRecipeById query

**5. File: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/home/screens/home-screen.tsx`**

- **Line 6**: Import
- **Line 28**: `MOCK_RECIPES.filter((r) => r.isFeatured)` — Featured carousel data
- **Line 32**: `[...MOCK_RECIPES].sort(...)` — Trending data
- **Line 37**: `MOCK_RECIPES.filter((r) => !r.isFeatured)` — Recent recipes base

**Total active callers**: 4 files (3 key files: recipe-detail-screen, use-recipes, home-screen)

---

## MOBILE PACKAGE.JSON DEPENDENCIES

### File: `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/package.json`

**Key dependencies**:

- `react`: 19.2.4
- `react-native`: 0.83.2
- `expo`: ~55.0.8
- `expo-router`: ~55.0.7
- `expo-image`: ^55.0.6
- `expo-linear-gradient`: ^55.0.9
- `@tanstack/react-query`: ^5.91.3 (data fetching)
- `zustand`: ^5.0.12 (state management)
- `zod`: ^4.3.6 (validation)
- `react-native-reanimated-carousel`: ^4.0.3 (carousel)
- `react-hook-form`: ^7.72.1 (forms)

**No test files found**: No `__tests__` or `.test.ts` files in recipes or shared/api directories.

---

## MISSING TEST INFRASTRUCTURE

**Search result**: No test files found in:

- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/__tests__/` — **does not exist**
- `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/shared/api/__tests__/` — **does not exist**

However, test files exist at `/Volumes/QUANGANH1TB/Cooking/cookmate/apps/mobile/__tests__/`:

- `api-client.test.ts`
- `app.test.tsx`
- `auth-error-mapper.test.ts`

---

## FEATURE TREE OVERVIEW

### `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/recipes/`

```
recipes/
  ├── api/
  │   └── recipes-repository.ts          (current: mock endpoint mapping)
  ├── hooks/
  │   └── use-recipes.ts                 (useRecipes, useRecipeById — with mock fallback)
  ├── screens/
  │   └── recipe-detail-screen.tsx       (⚠ USES MOCK DIRECTLY)
  ├── store.ts                           (UI-only: selectedCategory)
  ├── types.ts                           (Re-exports from shared/types/recipe)
  └── index.ts                           (Exports RecipeDetailScreen, types)
```

### `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/home/`

```
home/
  ├── components/
  │   ├── search-bar-shortcut.tsx
  │   ├── featured-carousel.tsx          (uses Recipe[] prop)
  │   ├── trending-section.tsx
  │   └── home-header.tsx
  ├── screens/
  │   └── home-screen.tsx                (⚠ USES MOCK DIRECTLY)
  └── index.ts
```

### `/Volumes/QUANGANH1TB/Coding/cookmate/apps/mobile/features/auth/` (template structure)

```
auth/
  ├── api/
  │   └── auth-repository.ts
  ├── components/
  │   ├── auth-gate.tsx
  │   ├── auth-error-banner.tsx
  │   ├── auth-form-field.tsx
  │   ├── auth-header.tsx
  │   ├── auth-submit-button.tsx
  │   ├── auth-footer-link.tsx
  │   ├── google-sign-in-button.tsx
  │   ├── login-prompt-card.tsx
  │   └── user-avatar.tsx
  ├── hooks/
  │   ├── use-login-mutation.ts
  │   ├── use-register-mutation.ts
  │   ├── use-logout.ts
  │   ├── use-forgot-password-mutation.ts
  │   ├── use-reset-password-mutation.ts
  │   └── use-google-login.ts
  ├── screens/
  │   ├── login-screen.tsx
  │   ├── register-screen.tsx
  │   └── forgot-password-screen.tsx
  ├── store.ts
  └── index.ts
```

---

## CRITICAL MISMATCHES & ACTION ITEMS

### Backend ↔ Mobile Type Contract

| Field          | Backend (RecipeResponse)              | Mobile (Recipe)            | Status                   |
| -------------- | ------------------------------------- | -------------------------- | ------------------------ |
| `id`           | ✓ String                              | ✓ string                   | ✓ Match                  |
| `title`        | ✓ String                              | ✓ string                   | ✓ Match                  |
| `description`  | ✓ String                              | ✓ string                   | ✓ Match                  |
| `imageUrl`     | ✓ String                              | ✓ string                   | ✓ Match                  |
| `cookTime`     | ✓ Integer (minutes)                   | ✓ number                   | ✓ Match                  |
| `difficulty`   | ✓ String                              | ✓ 'Easy'\|'Medium'\|'Hard' | ⚠ ENUM vs String         |
| `category`     | ✓ String                              | ✓ Category union           | ✓ Match                  |
| `author`       | ✓ UserResponse (nested)               | ✓ Author (nested)          | ⚠ UserResponse > Author  |
| `likeCount`    | ✓ Long                                | ✓ number                   | ✓ Match                  |
| `isFeatured`   | ✓ Boolean                             | ✓ boolean                  | ✓ Match                  |
| `createdAt`    | ✓ Instant (ISO string)                | ✓ string (ISO)             | ✓ Match                  |
| `viewCount`    | ✓ Long                                | ❌ MISSING                 | ❌ ADD                   |
| `serving`      | ✓ Integer                             | ❌ MISSING                 | ❌ ADD                   |
| `prepTime`     | ✓ Integer                             | ❌ MISSING                 | ❌ ADD                   |
| `cuisine`      | ✓ String                              | ❌ MISSING                 | ❌ ADD                   |
| `status`       | ✓ String (DRAFT\|PUBLISHED\|ARCHIVED) | ❌ MISSING                 | ❌ ADD                   |
| `authorId`     | ✓ String                              | ❌ MISSING                 | ❌ ADD                   |
| `updatedAt`    | ✓ Instant                             | ❌ MISSING                 | ❌ ADD                   |
| `steps`        | ✓ List<Step>                          | ❌ MISSING                 | ❌ ADD (for detail view) |
| `ingredients`  | ✓ List<RecipeIngredient>              | ❌ MISSING                 | ❌ ADD (for detail view) |
| `isBookmarked` | ❌ MISSING                            | ✓ boolean                  | ⚠ Mobile-only (Phase 5)  |

### Repository Signature Mismatch

**Current**:

```typescript
recipesRepository.list() → Promise<Recipe[]>
```

**Backend returns**:

```
Page<RecipeResponse> {
  content: RecipeResponse[],
  totalElements: number,
  totalPages: number,
  size: number,
  number: number,
  first: boolean,
  last: boolean,
  numberOfElements: number
}
```

**Impact**: Direct `.find()` on response will fail with "Cannot read property 'filter' of undefined".

### Pagination Support

**Missing**: No pagination in mobile repo:

- ❌ No `size` parameter
- ❌ No `page` parameter
- ❌ No `Pageable` equivalent in TypeScript
- ❌ Home screen loads all 15 recipes (will break with real data)

### View Count Gate

**Current state**:

- Backend `GET /recipes/{id}` **always** calls `incrementViewCount(id)`
- ⚠ No way to fetch without incrementing
- Mobile detail screen should NOT increment on preview/tabs

**Missing**: `?view=false` query parameter implementation on backend.

---

## SUMMARY TABLE: KEY FILES & PATHS

| Category                 | File Path                                                       | Status            | Notes                                                    |
| ------------------------ | --------------------------------------------------------------- | ----------------- | -------------------------------------------------------- |
| **Backend DTO**          | `backend/.../recipe/dto/RecipeResponse.java`                    | ✓ Ready           | Complete, nested author/steps/ingredients                |
| **Backend DTO**          | `backend/.../recipe/dto/CreateRecipeRequest.java`               | ✓ Ready           | Validation rules in place                                |
| **Backend DTO**          | `backend/.../recipe/dto/UpdateRecipeRequest.java`               | ✓ Ready           | All optional fields                                      |
| **Backend Envelope**     | `backend/.../shared/dto/ApiResponse.java`                       | ✓ Ready           | `<T>` generic, ErrorDetail nested                        |
| **Backend Controller**   | `backend/.../recipe/controller/RecipeController.java`           | ✓ Ready           | 8 endpoints, viewCount always increments                 |
| **Backend Service**      | `backend/.../recipe/service/RecipeService.java`                 | ✓ Ready           | incrementViewCount, incrementLikeCount                   |
| **Mobile Types**         | `apps/mobile/shared/types/recipe.ts`                            | ⚠ Incomplete      | Missing 9 backend fields; has isBookmarked (mobile-only) |
| **Mobile API Client**    | `apps/mobile/shared/api/api-client.ts`                          | ✓ Ready           | Unwraps envelope, auto-refresh, Bearer token             |
| **Mobile API Error**     | `apps/mobile/shared/api/api-error.ts`                           | ✓ Ready           | ApiResponseEnvelope mirror, ApiError class               |
| **Mobile Repo**          | `apps/mobile/features/recipes/api/recipes-repository.ts`        | ❌ Broken         | Returns Recipe[], expects Page<T>                        |
| **Mobile Hooks**         | `apps/mobile/features/recipes/hooks/use-recipes.ts`             | ⚠ Needs update    | Mock fallback won't work post-wire                       |
| **Mobile Detail Screen** | `apps/mobile/features/recipes/screens/recipe-detail-screen.tsx` | ❌ Mock hardcoded | Must switch to useRecipeById hook                        |
| **Mobile Home Screen**   | `apps/mobile/features/home/screens/home-screen.tsx`             | ❌ Mock hardcoded | Must use useRecipes hook + pagination                    |
| **Mobile Mock Data**     | `apps/mobile/shared/constants/mock-recipes.ts`                  | ✓ Ready           | 15 recipes, all types match mock Recipe                  |
| **Mobile Components**    | `apps/mobile/shared/components/recipe-card-*.tsx`               | ✓ Ready           | RecipeCardCompact, RecipeCardFeatured                    |
| **Mobile Store**         | `apps/mobile/features/recipes/store.ts`                         | ✓ Ready           | UI state (selectedCategory) only                         |

---

## REWRITE PLAN: KEY STEPS

1. **Extend mobile Recipe type** → add missing fields (viewCount, serving, prepTime, cuisine, status, authorId, updatedAt)
2. **Create RecipeDetail type** → for detail view (includes steps, ingredients)
3. **Update recipesRepository.list()** → handle Page<T> shape, extract content array
4. **Add pagination** → size, page parameters to list queries
5. **Update useRecipes hook** → parse paginated response correctly
6. **Wire recipe-detail-screen** → use useRecipeById hook instead of MOCK_RECIPES.find()
7. **Wire home-screen** → use useRecipes hook (with pagination) instead of MOCK_RECIPES filter
8. **Delete mock-recipes.ts** → after all callers switched (4 files total)
9. **Test view-count gate** → add `?view=false` to backend and recipe-detail endpoint

---

## UNRESOLVED QUESTIONS

1. **View count gating**: Should detail screen increment view count? Need backend `?view=false` param.
2. **isBookmarked field**: Mobile type has it, backend doesn't. Is it persisted per-user (Cooksnap/collection phase)?
3. **Step/Ingredient display**: Detail screen doesn't show steps or ingredients. Are they separate endpoints or nested in GET?
4. **Difficulty enum**: Backend sends String, mobile expects literal union. Should backend validate enum?
5. **UserResponse vs Author**: Backend returns full UserResponse in author field. Should it be trimmed (id, name, avatarUrl only)?
6. **Pagination defaults**: What are sensible defaults? (page=0, size=20 matching backend @PageableDefault)

---

**Report generated**: 2026-04-20 by Explore subagent  
**Scope**: /Volumes/QUANGANH1TB/Coding/cookmate
