import { apiClient } from '@/shared/api/api-client';
import type { Recipe } from '../types';

/** Repository for recipe API operations */
export const recipesRepository = {
  list: (params?: { category?: string }) =>
    apiClient<Recipe[]>(`/recipes${params?.category ? `?category=${params.category}` : ''}`),

  getById: (id: string) =>
    apiClient<Recipe>(`/recipes/${id}`),

  create: (data: Omit<Recipe, 'id' | 'createdAt' | 'likeCount'>) =>
    apiClient<Recipe>('/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
