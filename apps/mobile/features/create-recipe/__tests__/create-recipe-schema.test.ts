/**
 * Zod schema coverage — boundaries + required fields. Mirrors what the BE
 * `CreateRecipeRequest` validators enforce so we catch failures client-side.
 */

import {
  createRecipeSchema,
  type CreateRecipeFormValues,
} from '@/features/create-recipe/schemas/create-recipe-schema';

function base(): CreateRecipeFormValues {
  return {
    title: 'Phở Bò Hà Nội',
    description: 'Classic northern Vietnamese beef noodle soup',
    imageUrl: 'https://pub-xyz.r2.dev/abc.jpg',
    serving: 4,
    prepTime: 15,
    cookTime: 120,
    difficulty: 'HARD',
    cuisine: 'Vietnamese',
    status: 'PUBLISHED',
    category: 'Dinner',
    steps: [{ number: 1, description: 'Simmer bones' }],
    ingredients: [{ name: 'Beef bones', amount: 2, unit: 'kg' }],
  };
}

describe('createRecipeSchema', () => {
  it('accepts a canonical payload', () => {
    const parsed = createRecipeSchema.safeParse(base());
    expect(parsed.success).toBe(true);
  });

  it('rejects title shorter than 3 chars', () => {
    const parsed = createRecipeSchema.safeParse({ ...base(), title: 'Ph' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].path).toEqual(['title']);
    }
  });

  it('rejects empty steps array', () => {
    const parsed = createRecipeSchema.safeParse({ ...base(), steps: [] });
    expect(parsed.success).toBe(false);
  });

  it('rejects empty ingredients array', () => {
    const parsed = createRecipeSchema.safeParse({ ...base(), ingredients: [] });
    expect(parsed.success).toBe(false);
  });

  it('rejects invalid difficulty', () => {
    const parsed = createRecipeSchema.safeParse({
      ...base(),
      difficulty: 'EXTREME' as unknown as 'EASY',
    });
    expect(parsed.success).toBe(false);
  });

  it('requires imageUrl', () => {
    const parsed = createRecipeSchema.safeParse({ ...base(), imageUrl: '' });
    expect(parsed.success).toBe(false);
  });

  it('allows optional serving / cuisine / category', () => {
    const payload = { ...base() };
    delete (payload as Partial<CreateRecipeFormValues>).serving;
    delete (payload as Partial<CreateRecipeFormValues>).cuisine;
    delete (payload as Partial<CreateRecipeFormValues>).category;
    const parsed = createRecipeSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });
});
