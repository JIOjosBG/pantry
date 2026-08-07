import { onValue, push, ref, remove } from 'firebase/database';
import { nameKey } from '@/domain/normalize';
import { Recipe, RecipeIngredient, Unit } from '@/domain/types';
import { db } from '@/lib/firebase';

function recipesRef(householdId: string) {
  return ref(db(), `households/${householdId}/recipes`);
}

export function subscribeRecipes(
  householdId: string,
  onChange: (recipes: Recipe[]) => void,
  onError?: (error: Error) => void,
) {
  return onValue(
    recipesRef(householdId),
    (snapshot) => {
      const value = (snapshot.val() ?? {}) as Record<string, Omit<Recipe, 'id'>>;
      const recipes = Object.entries(value).map(([id, recipe]) => ({
        ...recipe,
        id,
        // Firebase drops empty arrays, so absent lists come back undefined.
        ingredients: recipe.ingredients ?? [],
        steps: recipe.steps ?? [],
      }));
      recipes.sort((a, b) => a.title.localeCompare(b.title));
      onChange(recipes);
    },
    onError,
  );
}

export type NewRecipe = {
  title: string;
  image?: string;
  servings: number;
  steps: string[];
  source: 'user' | 'spoonacular';
  spoonacularId?: number;
  ingredients: { name: string; qty: number; unit: Unit }[];
};

export async function saveRecipe(householdId: string, recipe: NewRecipe): Promise<string> {
  const ingredients: RecipeIngredient[] = recipe.ingredients
    .filter((ingredient) => ingredient.name.trim().length > 0)
    .map((ingredient) => ({
      name: ingredient.name.trim(),
      nameKey: nameKey(ingredient.name),
      qty: ingredient.qty,
      unit: ingredient.unit,
    }));

  const record = {
    title: recipe.title.trim(),
    servings: recipe.servings,
    steps: recipe.steps.filter((step) => step.trim().length > 0),
    source: recipe.source,
    ingredients,
    addedAt: Date.now(),
    ...(recipe.image ? { image: recipe.image } : {}),
    ...(recipe.spoonacularId ? { spoonacularId: recipe.spoonacularId } : {}),
  };

  const created = await push(recipesRef(householdId), record);
  return created.key!;
}

export async function removeRecipe(householdId: string, recipeId: string): Promise<void> {
  await remove(ref(db(), `households/${householdId}/recipes/${recipeId}`));
}

/** Spoonacular recipes are saved once; this tells the Discover tab what's already imported. */
export function importedSpoonacularIds(recipes: Recipe[]): Set<number> {
  return new Set(
    recipes
      .filter((recipe) => recipe.source === 'spoonacular' && recipe.spoonacularId)
      .map((recipe) => recipe.spoonacularId!),
  );
}
