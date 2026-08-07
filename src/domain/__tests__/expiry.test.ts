import { daysUntil, defaultExpiry, expiryLabel, expiryStatus, toISODate } from '../expiry';

const NOW = new Date(2026, 6, 26, 15, 30); // 26 July 2026, mid-afternoon

describe('daysUntil', () => {
  it('ignores the time of day', () => {
    expect(daysUntil('2026-07-26', NOW)).toBe(0);
    expect(daysUntil('2026-07-27', NOW)).toBe(1);
  });

  it('is negative for past dates', () => {
    expect(daysUntil('2026-07-24', NOW)).toBe(-2);
  });

  it('crosses month boundaries', () => {
    expect(daysUntil('2026-08-02', NOW)).toBe(7);
  });
});

describe('expiryStatus', () => {
  it('classifies by urgency', () => {
    expect(expiryStatus('2026-07-25', NOW)).toBe('expired');
    expect(expiryStatus('2026-07-26', NOW)).toBe('urgent');
    expect(expiryStatus('2026-07-28', NOW)).toBe('urgent');
    expect(expiryStatus('2026-07-30', NOW)).toBe('soon');
    expect(expiryStatus('2026-09-01', NOW)).toBe('ok');
  });
});

describe('expiryLabel', () => {
  it('uses relative wording near today', () => {
    expect(expiryLabel('2026-07-25', NOW)).toBe('Yesterday');
    expect(expiryLabel('2026-07-26', NOW)).toBe('Today');
    expect(expiryLabel('2026-07-27', NOW)).toBe('Tomorrow');
    expect(expiryLabel('2026-07-30', NOW)).toBe('In 4 days');
  });
});

describe('defaultExpiry', () => {
  it('suggests a shelf life per category', () => {
    expect(defaultExpiry('seafood', NOW)).toBe('2026-07-28');
    expect(defaultExpiry('produce', NOW)).toBe('2026-08-02');
  });

  it('produces a parseable ISO date', () => {
    expect(defaultExpiry('pantry', NOW)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('toISODate', () => {
  it('zero-pads month and day', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
