/**
 * Verifies `searchRepository.search` URL-encodes the query + forwards pagination.
 */

jest.mock('@/shared/api/api-client', () => ({
  apiClient: jest.fn(),
}));

import { apiClient } from '@/shared/api/api-client';
import { searchRepository } from '@/features/search/api/search-repository';
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

describe('searchRepository.search', () => {
  beforeEach(() => {
    mockApi.mockReset();
  });

  it('builds the endpoint with URL-encoded query + default pagination', async () => {
    mockApi.mockResolvedValueOnce(emptyPage());
    await searchRepository.search({ q: 'phở bò' });
    expect(mockApi).toHaveBeenCalledWith('/recipes/search?q=ph%E1%BB%9F%20b%C3%B2&page=0&size=20');
  });

  it('honors explicit page + size', async () => {
    mockApi.mockResolvedValueOnce(emptyPage());
    await searchRepository.search({ q: 'pho', page: 2, size: 5 });
    expect(mockApi).toHaveBeenCalledWith('/recipes/search?q=pho&page=2&size=5');
  });

  it('escapes characters that are reserved in query strings', async () => {
    mockApi.mockResolvedValueOnce(emptyPage());
    await searchRepository.search({ q: 'a & b=c' });
    expect(mockApi).toHaveBeenCalledWith('/recipes/search?q=a%20%26%20b%3Dc&page=0&size=20');
  });
});
