/** Re-export shared recipe types — source of truth is shared/types/recipe.ts */
export type {
  Recipe,
  Author,
  Category,
  Page,
  RecipeIngredient,
  RecipeStep,
  RecipeStatus,
  RecipeDifficulty,
} from '@/shared/types/recipe';
export { CATEGORIES } from '@/shared/types/recipe';
