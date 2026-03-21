/** Author of a recipe */
export interface Author {
  id: string;
  name: string;
  avatarUrl: string;
}

/** Recipe data model — matches future backend API contract */
export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  cookTime: number; // minutes
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: Category;
  author: Author;
  likeCount: number;
  isBookmarked: boolean;
  isFeatured: boolean;
  createdAt: string; // ISO date
}

/** Available recipe categories for filtering */
export type Category =
  | 'All'
  | 'Breakfast'
  | 'Lunch'
  | 'Dinner'
  | 'Dessert'
  | 'Snack'
  | 'Drink'
  | 'Vegetarian'
  | 'Seafood';

/** All categories for chip display */
export const CATEGORIES: Category[] = [
  'All',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Dessert',
  'Snack',
  'Drink',
  'Vegetarian',
  'Seafood',
];
