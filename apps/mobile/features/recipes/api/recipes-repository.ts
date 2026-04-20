import { apiClient } from '@/shared/api/api-client';
import type { Page, Recipe } from '../types';

/** Pagination args shared by all list endpoints. `page` is 0-indexed. */
export interface PageableParams {
  page?: number;
  size?: number;
}

function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

/**
 * Thin typed wrapper over the BE recipes endpoints. All responses arrive
 * pre-unwrapped (envelope stripped) via `apiClient`, so these return the
 * inner payload directly — `Page<Recipe>` for list shapes, `Recipe` for detail.
 */
export const recipesRepository = {
  list: ({ page = 0, size = 20 }: PageableParams = {}) =>
    apiClient<Page<Recipe>>(`/recipes${toQuery({ page, size })}`),

  /**
   * Fetch a single recipe. `view` defaults to `false` on the wire to prevent
   * double-counting when the detail screen prefetches from a card tap. Callers
   * that record a real page view pass `view: true`.
   */
  getById: (id: string, { view = false }: { view?: boolean } = {}) =>
    apiClient<Recipe>(`/recipes/${id}${toQuery({ view })}`),

  findByCategory: (category: string, { page = 0, size = 20 }: PageableParams = {}) =>
    apiClient<Page<Recipe>>(
      `/recipes/category/${encodeURIComponent(category)}${toQuery({ page, size })}`,
    ),

  findFeatured: ({ page = 0, size = 10 }: PageableParams = {}) =>
    apiClient<Page<Recipe>>(`/recipes/featured${toQuery({ page, size })}`),

  findByAuthor: (authorId: string, { page = 0, size = 20 }: PageableParams = {}) =>
    apiClient<Page<Recipe>>(
      `/recipes/author/${encodeURIComponent(authorId)}${toQuery({ page, size })}`,
    ),
};
