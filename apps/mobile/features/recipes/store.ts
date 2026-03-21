import { create } from 'zustand';
import type { Category } from './types';

/** UI-only state for recipe browsing — NOT server state */
interface RecipeUIState {
  selectedCategory: Category;
  setSelectedCategory: (category: Category) => void;
}

export const useRecipeUIStore = create<RecipeUIState>((set) => ({
  selectedCategory: 'All',
  setSelectedCategory: (category) => set({ selectedCategory: category }),
}));
