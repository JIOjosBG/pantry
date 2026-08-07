export const CATEGORIES = [
  'produce',
  'dairy',
  'meat',
  'seafood',
  'bakery',
  'pantry',
  'frozen',
  'drinks',
  'other',
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Units we understand. Anything else is stored verbatim and matched by presence only. */
export const UNITS = [
  'piece',
  'g',
  'kg',
  'ml',
  'l',
  'tbsp',
  'tsp',
  'cup',
  'pack',
] as const;

export type Unit = (typeof UNITS)[number];

export type PantryItem = {
  id: string;
  name: string;
  /** Normalized lowercase singular name — the join key for recipe matching. */
  nameKey: string;
  qty: number;
  unit: Unit;
  category: Category;
  /** ISO date string, yyyy-mm-dd. */
  expiry: string;
  addedAt: number;
  addedBy: string;
};

export type ShoppingEntry = {
  id: string;
  name: string;
  nameKey: string;
  qty: number;
  unit: Unit;
  category: Category;
  addedAt: number;
  sourceRecipeId?: string;
};

export type RecipeIngredient = {
  name: string;
  nameKey: string;
  qty: number;
  unit: Unit;
};

export type Recipe = {
  id: string;
  title: string;
  image?: string;
  servings: number;
  steps: string[];
  source: 'user' | 'spoonacular';
  spoonacularId?: number;
  ingredients: RecipeIngredient[];
  addedAt: number;
};

export type Household = {
  id: string;
  inviteCode: string;
  members: Record<string, boolean>;
};
