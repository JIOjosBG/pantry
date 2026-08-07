import { FOOD_EMOJI, foodEmoji } from '../emoji';

describe('foodEmoji', () => {
  it('matches plain names', () => {
    expect(foodEmoji('Banana')).toBe('🍌');
    expect(foodEmoji('milk')).toBe('🥛');
    expect(foodEmoji('Cheddar')).toBe('🧀');
  });

  it('matches plurals and messy input', () => {
    expect(foodEmoji('Bananas')).toBe('🍌');
    expect(foodEmoji('2 large eggs')).toBe('🥚');
    expect(foodEmoji('Chopped Tomatoes, tinned')).toBe('🥫');
    expect(foodEmoji('  strawberries!  ')).toBe('🍓');
  });

  it('prefers the longest phrase over a single word', () => {
    expect(foodEmoji('oil')).toBe('🫗');
    expect(foodEmoji('olive oil')).toBe('🫒');
    expect(foodEmoji('ice cream')).toBe('🍦');
    expect(foodEmoji('peanut butter')).toBe('🥜');
    expect(foodEmoji('butter beans')).toBe('🫘');
    expect(foodEmoji('black pepper')).toBe('🧂');
    expect(foodEmoji('pepper')).toBe('🫑');
  });

  it('falls back to the head noun for compound dishes', () => {
    expect(foodEmoji('chicken soup')).toBe('🍲');
    expect(foodEmoji('apple juice')).toBe('🧃');
    // "breast" is not a food word, so the modifier wins instead.
    expect(foodEmoji('chicken breast')).toBe('🍗');
  });

  it('handles single-word compounds via substring matching', () => {
    expect(foodEmoji('cheeseburger')).toBe('🍔');
    // Both "garlic" and "bread" are inside it; the rightmost match wins.
    expect(foodEmoji('garlicbread')).toBe('🍞');
  });

  it('falls back to the category, then a plate', () => {
    expect(foodEmoji('mystery tub', 'dairy')).toBe('🧀');
    expect(foodEmoji('xyzzy')).toBe('🍽️');
  });

  it('exposes a flat word lookup', () => {
    expect(FOOD_EMOJI.avocado).toBe('🥑');
    expect(FOOD_EMOJI['sweet potato']).toBe('🍠');
  });
});
