import { daysUntil } from './expiry';
import { convertTo, toBase } from './normalize';
import { PantryItem, Recipe, RecipeIngredient } from './types';

export type IngredientMatch = {
  ingredient: RecipeIngredient;
  /** Pantry items whose nameKey matched this ingredient. */
  items: PantryItem[];
  satisfied: boolean;
  /**
   * True when the units could not be compared (e.g. "200 g flour" against
   * "1 pack flour") and we fell back to "you have some of this".
   */
  approximate: boolean;
};

export type RecipeMatch = {
  recipe: Recipe;
  matches: IngredientMatch[];
  missing: RecipeIngredient[];
  /** Pantry items this recipe would consume. */
  usedItems: PantryItem[];
  /** Days until the soonest-expiring used item; Infinity when nothing matched. */
  urgency: number;
};

/** An ingredient matches an item when either canonical name contains the other. */
function itemsFor(ingredient: RecipeIngredient, items: PantryItem[]): PantryItem[] {
  const key = ingredient.nameKey;
  if (!key) return [];
  return items.filter(
    (item) => item.nameKey === key || item.nameKey.includes(key) || key.includes(item.nameKey),
  );
}

function matchIngredient(
  ingredient: RecipeIngredient,
  pantry: PantryItem[],
): IngredientMatch {
  const items = itemsFor(ingredient, pantry);
  if (items.length === 0) {
    return { ingredient, items, satisfied: false, approximate: false };
  }

  const required = toBase(ingredient.qty, ingredient.unit);

  // Sum in the base unit, and only over the matched items whose unit is
  // comparable with the requirement, so "500 ml milk" + "1 l milk" adds up to
  // 1500 ml while "1 pack flour" never inflates a gram requirement.
  let availableInBase = 0;
  let sawComparable = false;
  for (const item of items) {
    const available = toBase(item.qty, item.unit);
    if (required && available && available.base === required.base) {
      sawComparable = true;
      availableInBase += available.qty;
    }
  }

  if (!sawComparable) {
    // Units are incomparable — we know the ingredient is in the pantry but not
    // whether there is enough of it.
    return { ingredient, items, satisfied: true, approximate: true };
  }

  return {
    ingredient,
    items,
    satisfied: availableInBase >= required!.qty,
    approximate: false,
  };
}

export function matchRecipe(recipe: Recipe, pantry: PantryItem[], now = new Date()): RecipeMatch {
  const matches = recipe.ingredients.map((ingredient) => matchIngredient(ingredient, pantry));
  const missing = matches.filter((m) => !m.satisfied).map((m) => m.ingredient);

  const usedItems = matches
    .filter((m) => m.satisfied)
    .flatMap((m) => m.items)
    .filter((item, index, all) => all.findIndex((other) => other.id === item.id) === index);

  const urgency = usedItems.reduce(
    (soonest, item) => Math.min(soonest, daysUntil(item.expiry, now)),
    Number.POSITIVE_INFINITY,
  );

  return { recipe, matches, missing, usedItems, urgency };
}

/**
 * Work out what cooking a recipe should take out of the pantry: each satisfied
 * ingredient is drawn from its matching items, soonest expiry first, so cooking
 * uses up the food that would otherwise go off.
 *
 * Ingredients matched only approximately (incomparable units) are skipped — we
 * can't know how much of a "pack" a 200 g requirement uses.
 */
export function plannedUsage(match: RecipeMatch): { item: PantryItem; qty: number }[] {
  const usage: { item: PantryItem; qty: number }[] = [];

  for (const ingredientMatch of match.matches) {
    if (!ingredientMatch.satisfied || ingredientMatch.approximate) continue;

    let outstanding = ingredientMatch.ingredient.qty;
    const candidates = [...ingredientMatch.items].sort((a, b) => a.expiry.localeCompare(b.expiry));

    for (const item of candidates) {
      if (outstanding <= 0) break;
      const needInItemUnit = convertTo(outstanding, ingredientMatch.ingredient.unit, item.unit);
      if (needInItemUnit === null) continue;

      const take = Math.min(item.qty, needInItemUnit);
      if (take <= 0) continue;

      usage.push({ item, qty: Math.round(take * 100) / 100 });
      const takenInIngredientUnit = convertTo(take, item.unit, ingredientMatch.ingredient.unit);
      outstanding -= takenInIngredientUnit ?? outstanding;
    }
  }

  return usage;
}

/** How close a recipe is to being cookable, worst case last. */
export type CookTier = 'cookable' | 'almost' | 'rest';

export type RankedRecipe = RecipeMatch & { tier: CookTier };

const TIER_ORDER: Record<CookTier, number> = { cookable: 0, almost: 1, rest: 2 };

/**
 * Rank every recipe by how close it is to the pot: cookable first, then the
 * ones a few ingredients short, then everything else.
 *
 * Where a recipe came from — imported or written by hand — plays no part in the
 * order; only what the pantry can cover does.
 *
 * Within a tier, fewer missing ingredients wins, then the soonest expiry among
 * the items the recipe uses, so the fridge's most urgent food surfaces first,
 * tie-broken by how many expiring items the recipe clears. Title breaks the
 * last tie so the list doesn't reshuffle between renders.
 */
export function rankRecipes(
  recipes: Recipe[],
  pantry: PantryItem[],
  options: { almostMax?: number; now?: Date } = {},
): RankedRecipe[] {
  const now = options.now ?? new Date();
  const almostMax = options.almostMax ?? 3;

  const countExpiring = (match: RecipeMatch) =>
    match.usedItems.filter((item) => daysUntil(item.expiry, now) <= 3).length;

  // A recipe with no ingredients isn't "cookable", it's unfinished — it sinks.
  const tierOf = (match: RecipeMatch): CookTier => {
    if (match.recipe.ingredients.length === 0) return 'rest';
    if (match.missing.length === 0) return 'cookable';
    return match.missing.length <= almostMax ? 'almost' : 'rest';
  };

  return recipes
    .map((recipe) => {
      const match = matchRecipe(recipe, pantry, now);
      return { ...match, tier: tierOf(match) };
    })
    .sort(
      (a, b) =>
        TIER_ORDER[a.tier] - TIER_ORDER[b.tier] ||
        a.missing.length - b.missing.length ||
        a.urgency - b.urgency ||
        countExpiring(b) - countExpiring(a) ||
        a.recipe.title.localeCompare(b.recipe.title),
    );
}
