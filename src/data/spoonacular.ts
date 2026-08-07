import { isUnit } from '@/domain/normalize';
import { Unit } from '@/domain/types';
import { NewRecipe } from './recipes';

const API = 'https://api.spoonacular.com';
const KEY = process.env.EXPO_PUBLIC_SPOONACULAR_KEY ?? '';

export const isSpoonacularConfigured = KEY.length > 0;

export class SpoonacularError extends Error {}

/** Spoonacular's free-text units mapped onto the units we store. */
const UNIT_ALIASES: Record<string, Unit> = {
  '': 'piece',
  g: 'g',
  gram: 'g',
  grams: 'g',
  gr: 'g',
  kg: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  oz: 'g',
  ounce: 'g',
  ounces: 'g',
  lb: 'kg',
  pound: 'kg',
  pounds: 'kg',
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  l: 'l',
  liter: 'l',
  liters: 'l',
  litre: 'l',
  tbsp: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  cup: 'cup',
  cups: 'cup',
  package: 'pack',
  packages: 'pack',
  can: 'pack',
  cans: 'pack',
  serving: 'piece',
  servings: 'piece',
  clove: 'piece',
  cloves: 'piece',
  slice: 'piece',
  slices: 'piece',
  piece: 'piece',
  pieces: 'piece',
};

/** Ounces and pounds are converted, so quantities need scaling to match. */
const UNIT_SCALE: Record<string, number> = {
  oz: 28.35,
  ounce: 28.35,
  ounces: 28.35,
  lb: 0.4536,
  pound: 0.4536,
  pounds: 0.4536,
};

function toUnit(raw: string | undefined): { unit: Unit; scale: number } {
  const key = (raw ?? '').trim().toLowerCase();
  const mapped = UNIT_ALIASES[key] ?? (isUnit(key) ? (key as Unit) : 'piece');
  return { unit: mapped, scale: UNIT_SCALE[key] ?? 1 };
}

type ApiIngredient = { name?: string; originalName?: string; amount?: number; unit?: string };

type ApiRecipe = {
  id: number;
  title: string;
  image?: string;
  servings?: number;
  extendedIngredients?: ApiIngredient[];
  usedIngredients?: ApiIngredient[];
  missedIngredients?: ApiIngredient[];
  analyzedInstructions?: { steps?: { step: string }[] }[];
  instructions?: string;
  missedIngredientCount?: number;
};

export type DiscoverRecipe = NewRecipe & {
  spoonacularId: number;
  /** How many ingredients Spoonacular thinks you're short of (pantry search only). */
  missedCount?: number;
};

async function request<T>(path: string, params: Record<string, string>): Promise<T> {
  if (!isSpoonacularConfigured) {
    throw new SpoonacularError('Add EXPO_PUBLIC_SPOONACULAR_KEY to .env to search recipes.');
  }
  const query = new URLSearchParams({ ...params, apiKey: KEY }).toString();
  const response = await fetch(`${API}${path}?${query}`);

  if (response.status === 401 || response.status === 403) {
    throw new SpoonacularError('Spoonacular rejected the API key.');
  }
  if (response.status === 402 || response.status === 429) {
    throw new SpoonacularError("Spoonacular's daily free quota is used up. Try again tomorrow.");
  }
  if (!response.ok) {
    throw new SpoonacularError(`Spoonacular request failed (${response.status}).`);
  }
  return (await response.json()) as T;
}

function toSteps(recipe: ApiRecipe): string[] {
  const analyzed = recipe.analyzedInstructions?.[0]?.steps?.map((step) => step.step) ?? [];
  if (analyzed.length > 0) return analyzed;
  if (!recipe.instructions) return [];
  // Fall back to the HTML blob some recipes carry instead of structured steps.
  return recipe.instructions
    .replace(/<[^>]+>/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function toIngredients(list: ApiIngredient[] | undefined) {
  return (list ?? []).map((ingredient) => {
    const { unit, scale } = toUnit(ingredient.unit);
    const amount = ingredient.amount ?? 1;
    return {
      name: ingredient.originalName ?? ingredient.name ?? 'ingredient',
      qty: Math.round(amount * scale * 100) / 100 || 1,
      unit,
    };
  });
}

function toDiscoverRecipe(recipe: ApiRecipe): DiscoverRecipe {
  const ingredients =
    recipe.extendedIngredients && recipe.extendedIngredients.length > 0
      ? toIngredients(recipe.extendedIngredients)
      : [...toIngredients(recipe.usedIngredients), ...toIngredients(recipe.missedIngredients)];

  return {
    title: recipe.title,
    image: recipe.image,
    servings: recipe.servings ?? 2,
    steps: toSteps(recipe),
    source: 'spoonacular',
    spoonacularId: recipe.id,
    ingredients,
    missedCount: recipe.missedIngredientCount,
  };
}

/** Free-text recipe search. */
export async function searchRecipes(query: string, number = 12): Promise<DiscoverRecipe[]> {
  const data = await request<{ results: ApiRecipe[] }>('/recipes/complexSearch', {
    query,
    number: String(number),
    addRecipeInformation: 'true',
    fillIngredients: 'true',
    instructionsRequired: 'true',
  });
  return (data.results ?? []).map(toDiscoverRecipe);
}

/**
 * Recipes built around what's already in the pantry. Spoonacular returns no
 * instructions here, so the details are fetched in one bulk follow-up call.
 */
export async function searchByIngredients(
  ingredientKeys: string[],
  number = 12,
): Promise<DiscoverRecipe[]> {
  if (ingredientKeys.length === 0) return [];

  const found = await request<ApiRecipe[]>('/recipes/findByIngredients', {
    ingredients: ingredientKeys.slice(0, 30).join(','),
    number: String(number),
    ranking: '2', // minimise missing ingredients
    ignorePantry: 'true',
  });
  if (found.length === 0) return [];

  const missedById = new Map(found.map((r) => [r.id, r.missedIngredientCount ?? 0]));

  try {
    const detailed = await request<ApiRecipe[]>('/recipes/informationBulk', {
      ids: found.map((r) => r.id).join(','),
    });
    return detailed.map((recipe) => ({
      ...toDiscoverRecipe(recipe),
      missedCount: missedById.get(recipe.id),
    }));
  } catch {
    // Quota can run out between the two calls — the summaries are still useful.
    return found.map(toDiscoverRecipe);
  }
}
