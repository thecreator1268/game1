import { describe, expect, it } from 'vitest';
import { paramsForLevel, SHAPES } from './params';

describe('paramsForLevel', () => {
  it('never requests more options than there are shapes', () => {
    for (let level = 1; level <= 10; level++) {
      expect(paramsForLevel(level).options).toBeLessThanOrEqual(SHAPES.length);
    }
  });
});
