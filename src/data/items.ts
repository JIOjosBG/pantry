import { onValue, push, ref, remove, update } from 'firebase/database';
import { foodEmoji } from '@/domain/emoji';
import { daysUntil } from '@/domain/expiry';
import { nameKey } from '@/domain/normalize';
import { Category, PantryItem, Unit } from '@/domain/types';
import { db } from '@/lib/firebase';

function itemsRef(householdId: string) {
  return ref(db(), `households/${householdId}/items`);
}

/** Live pantry contents, already sorted by soonest expiry. */
export function subscribeItems(
  householdId: string,
  onChange: (items: PantryItem[]) => void,
  onError?: (error: Error) => void,
) {
  return onValue(
    itemsRef(householdId),
    (snapshot) => {
      const value = (snapshot.val() ?? {}) as Record<string, Omit<PantryItem, 'id'>>;
      const items = Object.entries(value).map(([id, item]) => ({ ...item, id }));
      items.sort(
        (a, b) => daysUntil(a.expiry) - daysUntil(b.expiry) || a.name.localeCompare(b.name),
      );
      onChange(items);
    },
    onError,
  );
}

export type NewItem = {
  name: string;
  qty: number;
  unit: Unit;
  category: Category;
  expiry: string;
};

export async function addItem(householdId: string, uid: string, item: NewItem): Promise<void> {
  const entry = {
    ...item,
    name: item.name.trim(),
    nameKey: nameKey(item.name),
    emoji: foodEmoji(item.name, item.category),
    addedAt: Date.now(),
    addedBy: uid,
  };
  await push(itemsRef(householdId), entry);
}

export async function updateItem(
  householdId: string,
  itemId: string,
  changes: Partial<NewItem>,
): Promise<void> {
  const patch: Record<string, unknown> = { ...changes };
  if (changes.name !== undefined) {
    patch.name = changes.name.trim();
    patch.nameKey = nameKey(changes.name);
    patch.emoji = foodEmoji(changes.name, changes.category);
  }
  await update(ref(db(), `households/${householdId}/items/${itemId}`), patch);
}

export async function removeItem(householdId: string, itemId: string): Promise<void> {
  await remove(ref(db(), `households/${householdId}/items/${itemId}`));
}

/**
 * Change an item's quantity by `delta`. Reaching zero removes the item, since
 * an empty pantry entry is just noise.
 */
export async function adjustQty(
  householdId: string,
  item: PantryItem,
  delta: number,
): Promise<void> {
  const next = Math.round((item.qty + delta) * 100) / 100;
  if (next <= 0) {
    await removeItem(householdId, item.id);
    return;
  }
  await update(ref(db(), `households/${householdId}/items/${item.id}`), { qty: next });
}

/**
 * Deduct what a recipe uses from the pantry in one atomic write, deleting any
 * item that is fully used up.
 */
export async function consumeItems(
  householdId: string,
  usage: { item: PantryItem; qty: number }[],
): Promise<void> {
  const patch: Record<string, unknown> = {};
  for (const { item, qty } of usage) {
    const next = Math.round((item.qty - qty) * 100) / 100;
    const path = `households/${householdId}/items/${item.id}`;
    if (next > 0) {
      // Patch only the quantity: writing the whole object back would need the
      // `id` field stripped, and Firebase rejects undefined values.
      patch[`${path}/qty`] = next;
    } else {
      patch[path] = null;
    }
  }
  await update(ref(db()), patch);
}
