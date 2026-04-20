import { apiClient } from '@/shared/api/api-client';

export interface IngredientSuggestion {
  id: string;
  name: string;
  category?: string;
  unitDefault?: string;
}

/**
 * The BE currently exposes only {@code GET /api/ingredients} (non-paginated, full list) — small
 * dataset (~150 items) so we fetch once and filter client-side in the autocomplete hook.
 */
export const ingredientsRepository = {
  listAll: () => apiClient<IngredientSuggestion[]>('/ingredients'),
};
