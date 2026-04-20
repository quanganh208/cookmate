import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ingredientsRepository, type IngredientSuggestion } from '../api/ingredients-repository';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';

const MAX_MATCHES = 8;
const HOUR = 60 * 60 * 1000;

function normalise(s: string): string {
  return s
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Ingredient autocomplete. BE returns the full catalog (~150 items), so we fetch once and
 * filter client-side — simpler than a paginated search endpoint and effectively instant.
 */
export function useIngredientsSearch(query: string) {
  const debounced = useDebouncedValue(query, 150);
  const catalogQuery = useQuery({
    queryKey: ['ingredients', 'catalog'],
    queryFn: () => ingredientsRepository.listAll(),
    staleTime: HOUR,
  });

  const matches = useMemo<IngredientSuggestion[]>(() => {
    const q = normalise(debounced.trim());
    if (!q) return [];
    const catalog = catalogQuery.data ?? [];
    return catalog.filter((i) => normalise(i.name).includes(q)).slice(0, MAX_MATCHES);
  }, [debounced, catalogQuery.data]);

  return { matches, isLoading: catalogQuery.isLoading };
}
