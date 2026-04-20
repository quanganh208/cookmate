import { apiClient } from '@/shared/api/api-client';
import type { Page, Recipe } from '@/shared/types/recipe';

export interface SearchParams {
  q: string;
  page?: number;
  size?: number;
}

/**
 * Full-text search endpoint wrapper. The BE validates `q` (@NotBlank, length 1–200)
 * and caps page `size` at 50 globally, so we send params straight through.
 */
export const searchRepository = {
  search: ({ q, page = 0, size = 20 }: SearchParams) => {
    const qs = `?q=${encodeURIComponent(q)}` + `&page=${page}` + `&size=${size}`;
    return apiClient<Page<Recipe>>(`/recipes/search${qs}`);
  },
};
