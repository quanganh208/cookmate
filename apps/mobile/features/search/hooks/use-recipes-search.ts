import { useInfiniteQuery } from '@tanstack/react-query';
import { searchRepository } from '../api/search-repository';
import type { Page, Recipe } from '@/shared/types/recipe';

const STALE_TIME = 2 * 60 * 1000;
const DEFAULT_SIZE = 20;

function getNextPageParam(last: Page<Recipe>): number | undefined {
  return last.last ? undefined : last.number + 1;
}

/**
 * Infinite search query. Disabled until the caller passes a non-empty,
 * non-whitespace `q` — prevents a dangling request during the initial
 * idle state and while the debounce hasn't settled yet.
 */
export function useRecipesSearch(q: string, size: number = DEFAULT_SIZE) {
  const trimmed = q.trim();
  return useInfiniteQuery({
    queryKey: ['recipes', 'search', trimmed, { size }],
    queryFn: ({ pageParam = 0 }) =>
      searchRepository.search({ q: trimmed, page: pageParam as number, size }),
    initialPageParam: 0,
    getNextPageParam,
    staleTime: STALE_TIME,
    enabled: trimmed.length > 0,
  });
}
