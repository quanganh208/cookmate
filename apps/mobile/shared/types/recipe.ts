/**
 * Recipe types mirroring backend DTOs at
 * `backend/src/main/java/com/cookmate/recipe/dto/RecipeResponse.java`.
 * Keep field names aligned with the BE wire format (Jackson camelCase).
 */

/** Author info (from BE UserResponse). Only fields the mobile UI consumes. */
export interface Author {
  id: string;
  displayName: string;
  avatarUrl?: string;
}

/** Ingredient entry on a recipe. Mirrors BE `RecipeIngredient`. */
export interface RecipeIngredient {
  ingredientId?: string;
  name: string;
  amount?: number;
  unit?: string;
  note?: string;
}

/** Numbered step with optional media. Mirrors BE `Step`. */
export interface RecipeStep {
  number: number;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
}

/** Recipe lifecycle status on the wire. */
export type RecipeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

/** Difficulty is a free-form String from BE; mobile renders as-is. */
export type RecipeDifficulty = 'Easy' | 'Medium' | 'Hard' | string;

/**
 * Recipe data model — matches BE `RecipeResponse`.
 * `author`, `steps`, `ingredients` are populated on detail endpoints
 * and may be absent on list responses.
 */
export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  serving?: number;
  prepTime?: number;
  cookTime: number;
  difficulty: RecipeDifficulty;
  cuisine?: string;
  status?: RecipeStatus;
  viewCount?: number;
  likeCount: number;
  isFeatured: boolean;
  authorId?: string;
  author?: Author;
  category: Category;
  steps?: RecipeStep[];
  ingredients?: RecipeIngredient[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * Spring Data `Page<T>` wire shape. Mirrored so callers can drive
 * `useInfiniteQuery.getNextPageParam` off `.number` / `.last`.
 */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
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

/** All categories for chip display */
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
