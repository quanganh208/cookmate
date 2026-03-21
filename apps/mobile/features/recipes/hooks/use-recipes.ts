import { useQuery } from '@tanstack/react-query';
import { recipesRepository } from '../api/recipes-repository';
import { MOCK_RECIPES } from '@/shared/constants/mock-recipes';

/** Fetch recipe list — uses placeholder data until backend connected */
export function useRecipes(category?: string) {
  return useQuery({
    queryKey: ['recipes', category],
    queryFn: () => recipesRepository.list({ category }),
    placeholderData: MOCK_RECIPES,
  });
}

/** Fetch single recipe by ID */
export function useRecipeById(id: string) {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: () => recipesRepository.getById(id),
    enabled: !!id,
    placeholderData: MOCK_RECIPES.find((r) => r.id === id),
  });
}
