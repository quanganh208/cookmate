import { useQuery } from '@tanstack/react-query';
import { recipesRepository } from '../api/recipes-repository';

const STALE_MINUTES = 5;

/**
 * Fetch a single recipe by id. Passing `{ view: true }` increments viewCount
 * on the server — screens do this after confirming the user actually landed
 * on the detail page, not when merely prefetching.
 */
export function useRecipe(id: string | undefined, opts?: { view?: boolean }) {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: () => recipesRepository.getById(id as string, { view: opts?.view ?? false }),
    enabled: !!id,
    staleTime: STALE_MINUTES * 60 * 1000,
  });
}
