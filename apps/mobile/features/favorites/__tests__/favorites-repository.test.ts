/**
 * Verifies `favoritesRepository` talks to the right BE endpoints + shapes payloads correctly.
 */

jest.mock('@/shared/api/api-client', () => ({
  apiClient: jest.fn(),
}));

import { apiClient } from '@/shared/api/api-client';
import { favoritesRepository } from '@/features/favorites/api/favorites-repository';
import type { Page, Recipe } from '@/shared/types/recipe';

const mockApi = apiClient as unknown as jest.Mock;

function emptyPage(): Page<Recipe> {
  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
    first: true,
    last: true,
    numberOfElements: 0,
  };
}

describe('favoritesRepository', () => {
  beforeEach(() => {
    mockApi.mockReset();
  });

  it('getFavoritesRecipes defaults to page 0, size 20', async () => {
    mockApi.mockResolvedValueOnce(emptyPage());
    await favoritesRepository.getFavoritesRecipes();
    expect(mockApi).toHaveBeenCalledWith('/collections/favorites/recipes?page=0&size=20');
  });

  it('getFavoritesRecipes forwards explicit page + size', async () => {
    mockApi.mockResolvedValueOnce(emptyPage());
    await favoritesRepository.getFavoritesRecipes({ page: 2, size: 5 });
    expect(mockApi).toHaveBeenCalledWith('/collections/favorites/recipes?page=2&size=5');
  });

  it('addRecipe POSTs a JSON body with the recipeId', async () => {
    mockApi.mockResolvedValueOnce({});
    await favoritesRepository.addRecipe('abc-123');
    expect(mockApi).toHaveBeenCalledWith('/collections/favorites/recipes', {
      method: 'POST',
      body: JSON.stringify({ recipeId: 'abc-123' }),
    });
  });

  it('removeRecipe URL-encodes the recipe id and DELETEs', async () => {
    mockApi.mockResolvedValueOnce(undefined);
    await favoritesRepository.removeRecipe('a/b');
    expect(mockApi).toHaveBeenCalledWith('/collections/favorites/recipes/a%2Fb', {
      method: 'DELETE',
    });
  });

  it('isSaved URL-encodes the recipe id', async () => {
    mockApi.mockResolvedValueOnce({ saved: true });
    await favoritesRepository.isSaved('a b');
    expect(mockApi).toHaveBeenCalledWith('/collections/favorites/contains/a%20b');
  });
});
