import { describe, expect, it } from 'vitest';
import { ROUTINE_ITEMS } from './items';
import { cardCountForLevel } from './params';

describe('cardCountForLevel', () => {
  it('never requests more cards than there are routine items', () => {
    for (let level = 1; level <= 10; level++) {
      expect(cardCountForLevel(level)).toBeLessThanOrEqual(ROUTINE_ITEMS.length);
    }
  });
});
