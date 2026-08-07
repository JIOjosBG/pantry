import { Category, Unit, UNITS } from './types';

/** Words that describe preparation or state rather than the ingredient itself. */
const NOISE_WORDS = new Set([
  'fresh',
  'freshly',
  'frozen',
  'dried',
  'chopped',
  'sliced',
  'diced',
  'minced',
  'grated',
  'shredded',
  'ground',
  'whole',
  'large',
  'small',
  'medium',
  'ripe',
  'raw',
  'cooked',
  'boneless',
  'skinless',
  'organic',
  'unsalted',
  'salted',
  'peeled',
  'crushed',
  'finely',
  'roughly',
  'extra',
  'virgin',
  'plain',
  'low',
  'fat',
  'free',
  'range',
  'of',
  'and',
  'or',
  'a',
  'an',
  'the',
]);

/** Irregular plurals worth handling; the rest fall to the suffix rules below. */
const IRREGULAR_SINGULARS: Record<string, string> = {
  leaves: 'leaf',
  loaves: 'loaf',
  knives: 'knife',
  halves: 'half',
  potatoes: 'potato',
  tomatoes: 'tomato',
  mangoes: 'mango',
  chillies: 'chilli',
  anchovies: 'anchovy',
  berries: 'berry',
  cherries: 'cherry',
  peas: 'pea',
  oats: 'oats',
  greens: 'greens',
  molasses: 'molasses',
  hummus: 'hummus',
  couscous: 'couscous',
  asparagus: 'asparagus',
  swiss: 'swiss',
};

function singularize(word: string): string {
  if (IRREGULAR_SINGULARS[word]) return IRREGULAR_SINGULARS[word];
  if (word.length <= 3) return word;
  if (word.endsWith('ss') || word.endsWith('us') || word.endsWith('is')) return word;
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.endsWith('ches') || word.endsWith('shes') || word.endsWith('xes')) {
    return word.slice(0, -2);
  }
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}

/**
 * Turn a free-text ingredient or item name into the canonical key used to join
 * pantry items against recipe ingredients: lowercase, punctuation and quantity
 * fragments stripped, descriptors removed, each remaining word singularized.
 *
 * "2 Boneless Chicken Breasts, chopped" -> "chicken breast"
 */
export function nameKey(input: string): string {
  const cleaned = input
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned
    .split(' ')
    .filter((w) => w.length > 0 && !NOISE_WORDS.has(w))
    .map(singularize);

  // If stripping noise words left nothing, fall back to the cleaned input so we
  // never produce an empty key (e.g. "fresh" on its own).
  return words.length > 0 ? words.join(' ') : cleaned;
}

type BaseUnit = 'g' | 'ml' | 'piece';

/** Multipliers into a base unit. Volume spoon/cup sizes use metric conventions. */
const TO_BASE: Record<Unit, { base: BaseUnit; factor: number }> = {
  g: { base: 'g', factor: 1 },
  kg: { base: 'g', factor: 1000 },
  ml: { base: 'ml', factor: 1 },
  l: { base: 'ml', factor: 1000 },
  tbsp: { base: 'ml', factor: 15 },
  tsp: { base: 'ml', factor: 5 },
  cup: { base: 'ml', factor: 240 },
  piece: { base: 'piece', factor: 1 },
  pack: { base: 'piece', factor: 1 },
};

export function isUnit(value: string): value is Unit {
  return (UNITS as readonly string[]).includes(value);
}

/** Convert a quantity to its base unit, or null when the unit is unknown. */
export function toBase(qty: number, unit: Unit): { base: BaseUnit; qty: number } | null {
  const conversion = TO_BASE[unit];
  if (!conversion) return null;
  return { base: conversion.base, qty: qty * conversion.factor };
}

/** Express a quantity in another unit, or null when the units aren't comparable. */
export function convertTo(qty: number, from: Unit, to: Unit): number | null {
  const source = toBase(qty, from);
  const target = TO_BASE[to];
  if (!source || !target || source.base !== target.base) return null;
  return source.qty / target.factor;
}

/**
 * Compare a required amount against an available amount. Returns null when the
 * two units live in different measurement systems (g vs ml), in which case the
 * caller should fall back to presence-only matching.
 */
export function hasEnough(
  available: { qty: number; unit: Unit },
  required: { qty: number; unit: Unit },
): boolean | null {
  const a = toBase(available.qty, available.unit);
  const r = toBase(required.qty, required.unit);
  if (!a || !r || a.base !== r.base) return null;
  return a.qty >= r.qty;
}

/** Keyword hints for guessing a category from a name, checked in order. */
const CATEGORY_HINTS: [Category, string[]][] = [
  ['produce', ['apple', 'banana', 'lettuce', 'tomato', 'onion', 'garlic', 'carrot', 'potato', 'pepper', 'spinach', 'cucumber', 'lemon', 'lime', 'herb', 'basil', 'parsley', 'mushroom', 'broccoli', 'avocado', 'berry', 'orange', 'salad', 'courgette', 'zucchini', 'aubergine', 'celery', 'ginger', 'cabbage', 'leek']],
  ['dairy', ['milk', 'cheese', 'yoghurt', 'yogurt', 'butter', 'cream', 'egg', 'mozzarella', 'parmesan', 'feta', 'cheddar', 'quark']],
  ['meat', ['chicken', 'beef', 'pork', 'lamb', 'bacon', 'sausage', 'ham', 'turkey', 'mince', 'steak', 'chorizo', 'salami']],
  ['seafood', ['fish', 'salmon', 'tuna', 'prawn', 'shrimp', 'cod', 'squid', 'mussel', 'anchovy', 'crab']],
  ['bakery', ['bread', 'bun', 'roll', 'bagel', 'croissant', 'tortilla', 'pita', 'baguette', 'cake']],
  ['frozen', ['frozen', 'ice cream', 'pizza']],
  ['drinks', ['juice', 'water', 'beer', 'wine', 'soda', 'cola', 'coffee', 'tea', 'smoothie']],
  ['pantry', ['rice', 'pasta', 'flour', 'sugar', 'salt', 'oil', 'vinegar', 'bean', 'lentil', 'chickpea', 'sauce', 'stock', 'spice', 'cumin', 'paprika', 'oat', 'noodle', 'tin', 'can', 'honey', 'peanut', 'couscous', 'quinoa']],
];

/** Best-effort category from a name; defaults to "other". */
export function guessCategory(name: string): Category {
  const key = nameKey(name);
  for (const [category, hints] of CATEGORY_HINTS) {
    if (hints.some((hint) => key.includes(hint))) return category;
  }
  return 'other';
}
