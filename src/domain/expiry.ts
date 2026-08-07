import { Category } from './types';

export type ExpiryStatus = 'expired' | 'urgent' | 'soon' | 'ok';

/** Local-midnight timestamp, so day arithmetic ignores clock time. */
function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function toISODate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

/** Whole days from today until the given date. Negative when already past. */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const diff = startOfDay(parseISODate(iso)) - startOfDay(now);
  return Math.round(diff / 86_400_000);
}

export function expiryStatus(iso: string, now: Date = new Date()): ExpiryStatus {
  const days = daysUntil(iso, now);
  if (days < 0) return 'expired';
  if (days <= 2) return 'urgent';
  if (days <= 7) return 'soon';
  return 'ok';
}

export function expiryLabel(iso: string, now: Date = new Date()): string {
  const days = daysUntil(iso, now);
  if (days < -1) return `${Math.abs(days)} days ago`;
  if (days === -1) return 'Yesterday';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 14) return `In ${days} days`;
  return parseISODate(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/** How long each category typically keeps, used to pre-fill the date picker. */
const DEFAULT_SHELF_LIFE_DAYS: Record<Category, number> = {
  produce: 7,
  dairy: 10,
  meat: 3,
  seafood: 2,
  bakery: 4,
  pantry: 180,
  frozen: 90,
  drinks: 30,
  other: 14,
};

export function defaultExpiry(category: Category, now: Date = new Date()): string {
  const date = new Date(now);
  date.setDate(date.getDate() + DEFAULT_SHELF_LIFE_DAYS[category]);
  return toISODate(date);
}
