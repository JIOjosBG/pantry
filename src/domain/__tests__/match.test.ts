import { matchRecipe, plannedUsage, rankRecipes } from '../match';
import { nameKey } from '../normalize';
import { Category, PantryItem, Recipe, Unit } from '../types';

const NOW = new Date(2026, 6, 26);

function item(
  name: string,
  qty: number,
  unit: Unit,
  expiry: string,
  category: Category = 'other',
): PantryItem {
  return {
    id: `${name}-${expiry}`,
    name,
    nameKey: nameKey(name),
    qty,
    unit,
    category,
    expiry,
    addedAt: 0,
    addedBy: 'test',
  };
}

function recipe(title: string, ingredients: [string, number, Unit][]): Recipe {
  return {
    id: title,
    title,
    servings: 2,
    steps: ['Cook it.'],
    source: 'user',
    addedAt: 0,
    ingredients: ingredients.map(([name, qty, unit]) => ({
      name,
      nameKey: nameKey(name),
      qty,
      unit,
    })),
  };
}

describe('matchRecipe', () => {
  it('marks a recipe cookable when every ingredient is covered', () => {
    const pantry = [
      item('Chicken breast', 500, 'g', '2026-07-28'),
      item('Rice', 1, 'kg', '2027-01-01'),
    ];
    const result = matchRecipe(recipe('Chicken rice', [['chicken breast', 300, 'g'], ['rice', 200, 'g']]), pantry, NOW);

    expect(result.missing).toEqual([]);
    expect(result.usedItems).toHaveLength(2);
  });

  it('reports ingredients there is not enough of as missing', () => {
    const pantry = [item('Chicken breast', 100, 'g', '2026-07-28')];
    const result = matchRecipe(recipe('Big roast', [['chicken breast', 800, 'g']]), pantry, NOW);

    expect(result.missing.map((i) => i.nameKey)).toEqual(['chicken breast']);
  });

  it('sums multiple pantry entries of the same ingredient', () => {
    const pantry = [
      item('Milk', 500, 'ml', '2026-07-29'),
      item('Milk', 1, 'l', '2026-08-05'),
    ];
    const result = matchRecipe(recipe('Pancakes', [['milk', 1200, 'ml']]), pantry, NOW);

    expect(result.missing).toEqual([]);
  });

  it('falls back to presence matching when units are incomparable', () => {
    const pantry = [item('Flour', 1, 'pack', '2027-01-01')];
    const result = matchRecipe(recipe('Bread', [['flour', 400, 'g']]), pantry, NOW);

    expect(result.missing).toEqual([]);
    expect(result.matches[0].approximate).toBe(true);
  });

  it('takes urgency from the soonest-expiring item it would use', () => {
    const pantry = [
      item('Spinach', 200, 'g', '2026-07-27'),
      item('Rice', 1, 'kg', '2027-01-01'),
    ];
    const result = matchRecipe(recipe('Spinach rice', [['spinach', 100, 'g'], ['rice', 100, 'g']]), pantry, NOW);

    expect(result.urgency).toBe(1);
  });

  it('matches plural pantry names against singular ingredients', () => {
    const pantry = [item('Eggs', 6, 'piece', '2026-08-10')];
    const result = matchRecipe(recipe('Omelette', [['egg', 3, 'piece']]), pantry, NOW);

    expect(result.missing).toEqual([]);
  });
});

describe('plannedUsage', () => {
  it('deducts the required amount in the pantry item\'s own unit', () => {
    const pantry = [item('Rice', 1, 'kg', '2027-01-01')];
    const usage = plannedUsage(matchRecipe(recipe('Rice bowl', [['rice', 250, 'g']]), pantry, NOW));

    expect(usage).toEqual([{ item: pantry[0], qty: 0.25 }]);
  });

  it('draws from the soonest-expiring item first', () => {
    const older = item('Milk', 500, 'ml', '2026-07-27');
    const newer = item('Milk', 500, 'ml', '2026-08-10');
    const usage = plannedUsage(
      matchRecipe(recipe('Porridge', [['milk', 700, 'ml']]), [newer, older], NOW),
    );

    expect(usage[0].item.expiry).toBe('2026-07-27');
    expect(usage[0].qty).toBe(500);
    expect(usage[1].qty).toBe(200);
  });

  it('leaves approximately matched ingredients alone', () => {
    const pantry = [item('Flour', 1, 'pack', '2027-01-01')];
    const usage = plannedUsage(matchRecipe(recipe('Bread', [['flour', 400, 'g']]), pantry, NOW));

    expect(usage).toEqual([]);
  });

  it('never plans to take more than an item holds', () => {
    const pantry = [item('Butter', 100, 'g', '2026-08-01')];
    const usage = plannedUsage(matchRecipe(recipe('Cake', [['butter', 250, 'g']]), pantry, NOW));

    expect(usage.every((entry) => entry.qty <= entry.item.qty)).toBe(true);
  });
});

describe('rankRecipes', () => {
  const pantry = [
    item('Spinach', 200, 'g', '2026-07-27', 'produce'),
    item('Rice', 1, 'kg', '2027-06-01', 'pantry'),
    item('Eggs', 6, 'piece', '2026-08-20', 'dairy'),
  ];

  const spinachRice = recipe('Spinach rice', [['spinach', 100, 'g'], ['rice', 150, 'g']]);
  const eggRice = recipe('Egg fried rice', [['egg', 2, 'piece'], ['rice', 150, 'g']]);
  const carbonara = recipe('Carbonara', [['egg', 2, 'piece'], ['pasta', 200, 'g'], ['bacon', 100, 'g']]);
  const feast = recipe('Feast', [['lobster', 1, 'piece'], ['truffle', 10, 'g'], ['caviar', 30, 'g'], ['champagne', 1, 'l']]);

  it('orders cookable recipes by soonest expiry of the food they use', () => {
    const ranked = rankRecipes([eggRice, spinachRice], pantry, { now: NOW });

    expect(ranked.map((m) => m.recipe.title)).toEqual(['Spinach rice', 'Egg fried rice']);
    expect(ranked.every((m) => m.tier === 'cookable')).toBe(true);
  });

  it('puts cookable first, then nearly cookable, then the rest', () => {
    const almost = recipe('Almost there', [['egg', 2, 'piece'], ['bacon', 100, 'g']]);
    const ranked = rankRecipes([feast, carbonara, almost, spinachRice], pantry, { now: NOW });

    expect(ranked.map((m) => m.recipe.title)).toEqual([
      'Spinach rice',
      'Almost there',
      'Carbonara',
      'Feast',
    ]);
    expect(ranked.map((m) => m.tier)).toEqual(['cookable', 'almost', 'almost', 'rest']);
  });

  it('keeps recipes missing more than the allowed number, ranked last', () => {
    const ranked = rankRecipes([feast], pantry, { now: NOW, almostMax: 3 });

    expect(ranked).toHaveLength(1);
    expect(ranked[0].tier).toBe('rest');
  });

  it('ranks on the pantry alone, not on where the recipe came from', () => {
    const imported = { ...spinachRice, id: 'imported', source: 'spoonacular' as const };
    const ranked = rankRecipes([carbonara, imported], pantry, { now: NOW });

    expect(ranked.map((m) => m.recipe.id)).toEqual(['imported', carbonara.id]);
  });

  it('returns every recipe exactly once', () => {
    const ranked = rankRecipes([spinachRice, carbonara, feast], pantry, { now: NOW });
    const ids = ranked.map((m) => m.recipe.id);

    expect(new Set(ids).size).toBe(3);
  });
});
