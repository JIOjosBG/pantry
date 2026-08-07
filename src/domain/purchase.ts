import { defaultExpiry } from './expiry';
import { Category, ShoppingEntry, Unit } from './types';

export type PurchasedItem = {
  /** The shopping entry this came from, so only bought items leave the list. */
  entryId: string;
  name: string;
  qty: number;
  unit: Unit;
  category: Category;
  expiry: string;
};

/** What the "Bought all" review screen starts from: every entry, with a suggested expiry. */
export function toPurchaseDrafts(entries: ShoppingEntry[], now = new Date()): PurchasedItem[] {
  return entries.map((entry) => ({
    entryId: entry.id,
    name: entry.name,
    qty: entry.qty,
    unit: entry.unit,
    category: entry.category,
    expiry: defaultExpiry(entry.category, now),
  }));
}
