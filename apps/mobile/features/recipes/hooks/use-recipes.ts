import { useInfiniteQuery } from '@tanstack/react-query';
import { recipesRepository } from '../api/recipes-repository';
import type { Page, Recipe } from '../types';

const STALE_MINUTES = 5;
const STALE_TIME = STALE_MINUTES * 60 * 1000;
const DEFAULT_SIZE = 20;

/**
 * `useInfiniteQuery.getNextPageParam` drives pagination from Spring Data's
 * `Page<T>`: return `undefined` on the last page (stops fetching), otherwise
 * the next 0-indexed page number.
 */
function getNextPageParam(lastPage: Page<Recipe>): number | undefined {
  return lastPage.last ? undefined : lastPage.number + 1;
}

/** Infinite feed of published recipes (home "Recent" section). */
export function useInfiniteRecipes(size: number = DEFAULT_SIZE) {
  return useInfiniteQuery({
    queryKey: ['recipes', 'list', { size }],
    queryFn: ({ pageParam = 0 }) => recipesRepository.list({ page: pageParam as number, size }),
    initialPageParam: 0,
    getNextPageParam,
    staleTime: STALE_TIME,
  });
}

/** Infinite feed filtered by category. Disabled when `category === 'All'`. */
export function useRecipesByCategory(category: string, size: number = DEFAULT_SIZE) {
  const enabled = !!category && category !== 'All';
  return useInfiniteQuery({
    queryKey: ['recipes', 'category', category, { size }],
    queryFn: ({ pageParam = 0 }) =>
      recipesRepository.findByCategory(category, { page: pageParam as number, size }),
    initialPageParam: 0,
    getNextPageParam,
    staleTime: STALE_TIME,
    enabled,
  });
}

/** Infinite feed of featured recipes (home carousel). */
export function useFeaturedRecipes(size: number = 10) {
  return useInfiniteQuery({
    queryKey: ['recipes', 'featured', { size }],
    queryFn: ({ pageParam = 0 }) =>
      recipesRepository.findFeatured({ page: pageParam as number, size }),
    initialPageParam: 0,
    getNextPageParam,
    staleTime: STALE_TIME,
  });
}

/** Flatten `InfiniteData<Page<Recipe>>` into a single list for rendering. */
export function flattenRecipePages(pages: Page<Recipe>[] | undefined): Recipe[] {
  if (!pages) return [];
  return pages.flatMap((p) => p.content);
}
