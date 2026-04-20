import { apiClient } from '@/shared/api/api-client';
import type { Page, Recipe } from '@/shared/types/recipe';

export interface ContainsResponse {
  saved: boolean;
}

/**
 * Mirror of the `/api/collections/favorites/*` endpoints added in Phase 4.4.
 * The heart button on recipe detail and the Favorites tab both go through here.
 */
export const favoritesRepository = {
  getFavoritesRecipes: ({ page = 0, size = 20 }: { page?: number; size?: number } = {}) =>
    apiClient<Page<Recipe>>(`/collections/favorites/recipes?page=${page}&size=${size}`),

  addRecipe: (recipeId: string) =>
    apiClient<unknown>('/collections/favorites/recipes', {
      method: 'POST',
      body: JSON.stringify({ recipeId }),
    }),

  removeRecipe: (recipeId: string) =>
    apiClient<void>(`/collections/favorites/recipes/${encodeURIComponent(recipeId)}`, {
      method: 'DELETE',
    }),

  isSaved: (recipeId: string) =>
    apiClient<ContainsResponse>(`/collections/favorites/contains/${encodeURIComponent(recipeId)}`),
};
