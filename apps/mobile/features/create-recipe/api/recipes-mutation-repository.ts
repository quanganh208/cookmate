import { apiClient } from '@/shared/api/api-client';
import type { Recipe } from '@/shared/types/recipe';
import type { CreateRecipeFormValues } from '../schemas/create-recipe-schema';

export const recipesMutationRepository = {
  create: (payload: CreateRecipeFormValues) =>
    apiClient<Recipe>('/recipes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
