/**
 * Optimistic toggle behaviour: the heart flips quickly in the cache (after onMutate's awaited
 * cancelQueries resolves), rolls back on error, and resettles against the server on success.
 */

jest.mock('@/features/favorites/api/favorites-repository', () => ({
  favoritesRepository: {
    addRecipe: jest.fn(),
    removeRecipe: jest.fn(),
  },
}));

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { favoritesRepository } from '@/features/favorites/api/favorites-repository';
import { useToggleSave } from '@/features/favorites/hooks/use-toggle-save';

const mockRepo = favoritesRepository as unknown as {
  addRecipe: jest.Mock;
  removeRecipe: jest.Mock;
};

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { queryClient, wrapper };
}

describe('useToggleSave', () => {
  beforeEach(() => {
    mockRepo.addRecipe.mockReset();
    mockRepo.removeRecipe.mockReset();
  });

  it('optimistically flips the cache on save', async () => {
    const { queryClient, wrapper } = setup();
    queryClient.setQueryData(['favorites', 'contains', 'r1'], { saved: false });
    mockRepo.addRecipe.mockResolvedValue(undefined);

    const { result } = renderHook(() => useToggleSave(), { wrapper });

    act(() => {
      result.current.mutate({ recipeId: 'r1', nextSaved: true });
    });

    await waitFor(() =>
      expect(queryClient.getQueryData(['favorites', 'contains', 'r1'])).toEqual({ saved: true }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRepo.addRecipe).toHaveBeenCalledWith('r1');
  });

  it('rolls the cache back to the previous value when the server rejects', async () => {
    const { queryClient, wrapper } = setup();
    queryClient.setQueryData(['favorites', 'contains', 'r1'], { saved: false });
    mockRepo.addRecipe.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useToggleSave(), { wrapper });

    act(() => {
      result.current.mutate({ recipeId: 'r1', nextSaved: true });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(['favorites', 'contains', 'r1'])).toEqual({ saved: false });
  });

  it('calls removeRecipe when unsaving', async () => {
    const { queryClient, wrapper } = setup();
    queryClient.setQueryData(['favorites', 'contains', 'r1'], { saved: true });
    mockRepo.removeRecipe.mockResolvedValue(undefined);

    const { result } = renderHook(() => useToggleSave(), { wrapper });

    act(() => {
      result.current.mutate({ recipeId: 'r1', nextSaved: false });
    });

    await waitFor(() =>
      expect(queryClient.getQueryData(['favorites', 'contains', 'r1'])).toEqual({ saved: false }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRepo.removeRecipe).toHaveBeenCalledWith('r1');
    expect(mockRepo.addRecipe).not.toHaveBeenCalled();
  });
});
