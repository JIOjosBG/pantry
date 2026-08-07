import { guessCategory, hasEnough, nameKey, toBase } from '../normalize';

describe('nameKey', () => {
  it('strips quantities, punctuation and preparation words', () => {
    expect(nameKey('2 Boneless Chicken Breasts, chopped')).toBe('chicken breast');
    expect(nameKey('Extra Virgin Olive Oil')).toBe('olive oil');
    expect(nameKey('Fresh Basil Leaves')).toBe('basil leaf');
  });

  it('ignores parenthetical notes', () => {
    expect(nameKey('Tomatoes (tinned)')).toBe('tomato');
  });

  it('matches singular and plural spellings to the same key', () => {
    expect(nameKey('Eggs')).toBe(nameKey('egg'));
    expect(nameKey('Cherries')).toBe(nameKey('cherry'));
    expect(nameKey('Potatoes')).toBe(nameKey('potato'));
  });

  it('leaves words that only look plural alone', () => {
    expect(nameKey('Hummus')).toBe('hummus');
    expect(nameKey('Asparagus')).toBe('asparagus');
    expect(nameKey('Couscous')).toBe('couscous');
  });

  it('never returns an empty key', () => {
    expect(nameKey('fresh')).toBe('fresh');
    expect(nameKey('!!!')).toBe('');
  });
});

describe('toBase', () => {
  it('converts weights and volumes to base units', () => {
    expect(toBase(1.5, 'kg')).toEqual({ base: 'g', qty: 1500 });
    expect(toBase(2, 'l')).toEqual({ base: 'ml', qty: 2000 });
    expect(toBase(3, 'tbsp')).toEqual({ base: 'ml', qty: 45 });
  });
});

describe('hasEnough', () => {
  it('compares across compatible units', () => {
    expect(hasEnough({ qty: 1, unit: 'kg' }, { qty: 500, unit: 'g' })).toBe(true);
    expect(hasEnough({ qty: 200, unit: 'g' }, { qty: 1, unit: 'kg' })).toBe(false);
    expect(hasEnough({ qty: 1, unit: 'l' }, { qty: 2, unit: 'cup' })).toBe(true);
  });

  it('returns null when the units are not comparable', () => {
    expect(hasEnough({ qty: 1, unit: 'pack' }, { qty: 200, unit: 'g' })).toBeNull();
    expect(hasEnough({ qty: 500, unit: 'ml' }, { qty: 500, unit: 'g' })).toBeNull();
  });

  it('treats an exactly sufficient amount as enough', () => {
    expect(hasEnough({ qty: 500, unit: 'g' }, { qty: 500, unit: 'g' })).toBe(true);
  });
});

describe('guessCategory', () => {
  it('recognises common foods', () => {
    expect(guessCategory('Chicken thighs')).toBe('meat');
    expect(guessCategory('Whole milk')).toBe('dairy');
    expect(guessCategory('Baby spinach')).toBe('produce');
    expect(guessCategory('Basmati rice')).toBe('pantry');
  });

  it('falls back to other', () => {
    expect(guessCategory('Mystery jar')).toBe('other');
  });
});
