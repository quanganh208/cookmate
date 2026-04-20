/**
 * Unit tests for `flattenRecipePages` — the only pure helper extractable from
 * the hooks file. Full useInfiniteQuery behavior is exercised via integration
 * tests on real screens; here we guarantee page flattening preserves order and
 * handles undefined.
 */

import { flattenRecipePages } from '@/features/recipes/hooks/use-recipes';
import type { Page, Recipe } from '@/features/recipes/types';

function makeRecipe(id: string): Recipe {
  return {
    id,
    title: `Recipe ${id}`,
    description: '',
    imageUrl: '',
    cookTime: 10,
    difficulty: 'Easy',
    category: 'Dinner',
    likeCount: 0,
    isFeatured: false,
    createdAt: '2026-04-20T00:00:00Z',
  };
}

function makePage(ids: string[], overrides: Partial<Page<Recipe>> = {}): Page<Recipe> {
  const content = ids.map(makeRecipe);
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

describe('flattenRecipePages', () => {
  it('returns [] when pages is undefined', () => {
    expect(flattenRecipePages(undefined)).toEqual([]);
  });

  it('flattens multiple pages in order', () => {
    const pages = [makePage(['a', 'b']), makePage(['c'])];
    const flat = flattenRecipePages(pages);
    expect(flat.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('handles an empty page', () => {
    const pages = [makePage(['a']), makePage([])];
    expect(flattenRecipePages(pages).map((r) => r.id)).toEqual(['a']);
  });
});
