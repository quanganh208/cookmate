/**
 * Unit tests for `recipesRepository`. Covers:
 *  - `list` passes paging params + unwraps `Page<Recipe>` through the envelope
 *  - `getById` defaults to `?view=false` (prefetch-safe), switches to `true` on opt-in
 *  - `findByCategory` / `findFeatured` / `findByAuthor` URL-encode path segments
 *
 * We mock the `apiClient` so network is never touched and assert the exact
 * endpoint string each method sends.
 */

jest.mock('@/shared/api/api-client', () => ({
  apiClient: jest.fn(),
}));

import { apiClient } from '@/shared/api/api-client';
import { recipesRepository } from '@/features/recipes/api/recipes-repository';
import type { Page, Recipe } from '@/features/recipes/types';

const mockApi = apiClient as unknown as jest.Mock;

function page<T>(content: T[], overrides: Partial<Page<T>> = {}): Page<T> {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    size: content.length,
    number: 0,
    first: true,
    last: true,
    numberOfElements: content.length,
    ...overrides,
  };
}

const sampleRecipe: Recipe = {
  id: 'r1',
  title: 'Phở',
  description: 'Noodle soup',
  imageUrl: 'https://example.com/pho.jpg',
  cookTime: 120,
  difficulty: 'Hard',
  category: 'Dinner',
  likeCount: 10,
  isFeatured: false,
  createdAt: '2026-04-20T00:00:00Z',
};

describe('recipesRepository', () => {
  beforeEach(() => {
    mockApi.mockReset();
  });

  it('list() sends default pagination and returns unwrapped Page<Recipe>', async () => {
    const paged = page([sampleRecipe]);
    mockApi.mockResolvedValueOnce(paged);

    const result = await recipesRepository.list();

    expect(mockApi).toHaveBeenCalledWith('/recipes?page=0&size=20');
    expect(result).toBe(paged);
    expect(result.content[0].title).toBe('Phở');
  });

  it('list() honors explicit page + size', async () => {
    mockApi.mockResolvedValueOnce(page([]));
    await recipesRepository.list({ page: 3, size: 5 });
    expect(mockApi).toHaveBeenCalledWith('/recipes?page=3&size=5');
  });

  it('getById() defaults to view=false to stay prefetch-safe', async () => {
    mockApi.mockResolvedValueOnce(sampleRecipe);
    await recipesRepository.getById('r1');
    expect(mockApi).toHaveBeenCalledWith('/recipes/r1?view=false');
  });

  it('getById({ view: true }) opts into view-count increment', async () => {
    mockApi.mockResolvedValueOnce(sampleRecipe);
    await recipesRepository.getById('r1', { view: true });
    expect(mockApi).toHaveBeenCalledWith('/recipes/r1?view=true');
  });

  it('findByCategory() URL-encodes the category segment', async () => {
    mockApi.mockResolvedValueOnce(page([]));
    await recipesRepository.findByCategory('Breakfast & Brunch');
    expect(mockApi).toHaveBeenCalledWith(
      '/recipes/category/Breakfast%20%26%20Brunch?page=0&size=20',
    );
  });

  it('findFeatured() defaults to size=10', async () => {
    mockApi.mockResolvedValueOnce(page([]));
    await recipesRepository.findFeatured();
    expect(mockApi).toHaveBeenCalledWith('/recipes/featured?page=0&size=10');
  });

  it('findByAuthor() URL-encodes authorId', async () => {
    mockApi.mockResolvedValueOnce(page([]));
    await recipesRepository.findByAuthor('u/42');
    expect(mockApi).toHaveBeenCalledWith('/recipes/author/u%2F42?page=0&size=20');
  });
});
