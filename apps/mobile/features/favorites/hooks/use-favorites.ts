import { useInfiniteQuery } from '@tanstack/react-query';
import { favoritesRepository } from '../api/favorites-repository';
import type { Page, Recipe } from '@/shared/types/recipe';

const STALE_TIME = 30 * 1000;
const DEFAULT_SIZE = 20;

function getNextPageParam(last: Page<Recipe>): number | undefined {
  return last.last ? undefined : last.number + 1;
}

/**
 * Paginated feed of the user's saved recipes. Single BE call per page — the backend hydrates
 * the recipe payloads itself and filters to published + own drafts.
 */
export function useFavorites(size: number = DEFAULT_SIZE) {
  return useInfiniteQuery({
    queryKey: ['favorites', 'recipes', { size }],
    queryFn: ({ pageParam = 0 }) =>
      favoritesRepository.getFavoritesRecipes({ page: pageParam as number, size }),
    initialPageParam: 0,
    getNextPageParam,
    staleTime: STALE_TIME,
  });
}
