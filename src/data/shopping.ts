import { onValue, push, ref, remove, update } from 'firebase/database';
import { guessCategory, nameKey } from '@/domain/normalize';
import { PurchasedItem } from '@/domain/purchase';
import { Category, RecipeIngredient, ShoppingEntry, Unit } from '@/domain/types';
import { db } from '@/lib/firebase';

function shoppingRef(householdId: string) {
  return ref(db(), `households/${householdId}/shopping`);
}

export function subscribeShopping(
  householdId: string,
  onChange: (entries: ShoppingEntry[]) => void,
  onError?: (error: Error) => void,
) {
  return onValue(
    shoppingRef(householdId),
    (snapshot) => {
      const value = (snapshot.val() ?? {}) as Record<string, Omit<ShoppingEntry, 'id'>>;
      const entries = Object.entries(value).map(([id, entry]) => ({ ...entry, id }));
      entries.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
      onChange(entries);
    },
    onError,
  );
}

export type NewShoppingEntry = {
  name: string;
  qty: number;
  unit: Unit;
  category?: Category;
  sourceRecipeId?: string;
};

export async function addShoppingEntry(
  householdId: string,
  entry: NewShoppingEntry,
): Promise<void> {
  const record: Omit<ShoppingEntry, 'id'> = {
    name: entry.name.trim(),
    nameKey: nameKey(entry.name),
    qty: entry.qty,
    unit: entry.unit,
    category: entry.category ?? guessCategory(entry.name),
    addedAt: Date.now(),
    ...(entry.sourceRecipeId ? { sourceRecipeId: entry.sourceRecipeId } : {}),
  };
  await push(shoppingRef(householdId), record);
}

export async function removeShoppingEntry(householdId: string, entryId: string): Promise<void> {
  await remove(ref(db(), `households/${householdId}/shopping/${entryId}`));
}

export async function adjustShoppingQty(
  householdId: string,
  entry: ShoppingEntry,
  delta: number,
): Promise<void> {
  const next = Math.round((entry.qty + delta) * 100) / 100;
  if (next <= 0) {
    await removeShoppingEntry(householdId, entry.id);
    return;
  }
  await update(ref(db(), `households/${householdId}/shopping/${entry.id}`), { qty: next });
}

/**
 * Add a recipe's missing ingredients to the list, skipping anything already on
 * it so repeated taps don't pile up duplicates.
 *
 * Returns how many entries were actually added.
 */
export async function addMissingIngredients(
  householdId: string,
  recipeId: string,
  missing: RecipeIngredient[],
  existing: ShoppingEntry[],
): Promise<number> {
  const alreadyListed = new Set(existing.map((entry) => entry.nameKey));
  const toAdd = missing.filter((ingredient) => !alreadyListed.has(ingredient.nameKey));

  const patch: Record<string, unknown> = {};
  for (const ingredient of toAdd) {
    const key = push(shoppingRef(householdId)).key!;
    patch[`households/${householdId}/shopping/${key}`] = {
      name: ingredient.name,
      nameKey: ingredient.nameKey,
      qty: ingredient.qty,
      unit: ingredient.unit,
      category: guessCategory(ingredient.name),
      addedAt: Date.now(),
      sourceRecipeId: recipeId,
    };
  }

  if (Object.keys(patch).length > 0) await update(ref(db()), patch);
  return toAdd.length;
}

/**
 * Move the bought items into the pantry and take them off the list — one atomic
 * write, so a half-applied "Bought all" can't leave items in both places.
 * Entries the user unticked stay on the list.
 */
export async function buyAll(
  householdId: string,
  uid: string,
  purchased: PurchasedItem[],
): Promise<void> {
  const patch: Record<string, unknown> = {};

  for (const item of purchased) {
    patch[`households/${householdId}/shopping/${item.entryId}`] = null;

    const key = push(ref(db(), `households/${householdId}/items`)).key!;
    patch[`households/${householdId}/items/${key}`] = {
      name: item.name.trim(),
      nameKey: nameKey(item.name),
      qty: item.qty,
      unit: item.unit,
      category: item.category,
      expiry: item.expiry,
      addedAt: Date.now(),
      addedBy: uid,
    };
  }

  await update(ref(db()), patch);
}
