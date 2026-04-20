import { useQuery } from '@tanstack/react-query';
import { favoritesRepository } from '../api/favorites-repository';

/**
 * Returns whether the given recipe is in the user's Favorites. Used by the SaveButton on the
 * detail screen. The mutation hook below writes optimistic updates straight into this cache
 * so the heart flips instantly.
 */
export function useIsSaved(recipeId: string | undefined) {
  return useQuery({
    queryKey: ['favorites', 'contains', recipeId],
    queryFn: () => favoritesRepository.isSaved(recipeId as string),
    enabled: !!recipeId,
    staleTime: 30 * 1000,
  });
}
