import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recipesMutationRepository } from '../api/recipes-mutation-repository';
import type { CreateRecipeFormValues } from '../schemas/create-recipe-schema';
import type { Recipe } from '@/shared/types/recipe';

/**
 * POST /api/recipes wrapper. On success we invalidate the cached recipe lists so the new entry
 * appears in the home feed without a manual pull-to-refresh.
 */
export function useCreateRecipe() {
  const queryClient = useQueryClient();
  return useMutation<Recipe, Error, CreateRecipeFormValues>({
    mutationFn: (values) => recipesMutationRepository.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['recipes', 'featured'] });
      queryClient.invalidateQueries({ queryKey: ['recipes', 'category'] });
    },
  });
}
