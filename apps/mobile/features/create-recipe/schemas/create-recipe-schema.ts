import { z } from 'zod';

/**
 * Validation schema for the create-recipe form. Mirrors the BE
 * {@code CreateRecipeRequest} validators so rejections happen client-side first and the
 * user sees field-level errors instead of a generic 400.
 */
export const recipeStepSchema = z.object({
  number: z.number().int().positive(),
  description: z.string().min(1, 'Step description is required'),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
});

export const recipeIngredientSchema = z.object({
  ingredientId: z.string().optional(),
  name: z.string().min(1, 'Ingredient name is required'),
  amount: z.number().positive().optional(),
  unit: z.string().optional(),
  note: z.string().optional(),
});

export const createRecipeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(500).optional(),
  imageUrl: z.string().min(1, 'Please add a picture of your dish'),
  serving: z.number().int().positive().optional(),
  prepTime: z.number().int().nonnegative().optional(),
  cookTime: z.number().int().nonnegative().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  cuisine: z.string().max(50).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('PUBLISHED'),
  category: z.string().max(50).optional(),
  steps: z.array(recipeStepSchema).min(1, 'Add at least one step'),
  ingredients: z.array(recipeIngredientSchema).min(1, 'Add at least one ingredient'),
});

export type CreateRecipeFormValues = z.infer<typeof createRecipeSchema>;
