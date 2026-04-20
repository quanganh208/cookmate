import { useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesRepository, type ContainsResponse } from '../api/favorites-repository';

type ToggleVars = { recipeId: string; nextSaved: boolean };

/**
 * Save / unsave mutation with optimistic UI. On mutate we flip the `['favorites','contains',id]`
 * cache entry so the heart toggles instantly; on error we roll back; on settle we invalidate the
 * Favorites list + the contains entry to re-sync against the server.
 */
export function useToggleSave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipeId, nextSaved }: ToggleVars) => {
      if (nextSaved) {
        await favoritesRepository.addRecipe(recipeId);
      } else {
        await favoritesRepository.removeRecipe(recipeId);
      }
    },
    onMutate: async ({ recipeId, nextSaved }) => {
      const key = ['favorites', 'contains', recipeId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ContainsResponse>(key);
      queryClient.setQueryData<ContainsResponse>(key, { saved: nextSaved });
      return { previous, key };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
    onSettled: (_data, _err, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: ['favorites', 'contains', recipeId] });
      queryClient.invalidateQueries({ queryKey: ['favorites', 'recipes'] });
    },
  });
}
