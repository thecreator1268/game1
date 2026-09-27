import { describe, expect, it } from 'vitest';
import { gridColumnsForSize, paramsForLevel } from './params';

describe('gridColumnsForSize', () => {
  it('never exceeds 4 columns, so a 64px tap-target grid fits a phone-width viewport', () => {
    // 5+ columns of 64px minimum-width tiles (plus gaps) overflow a
    // ~360-375px phone viewport — confirmed via a real mobile Playwright
    // check at level 10 (gridSize 24) before this fix.
    for (let level = 1; level <= 10; level++) {
      expect(gridColumnsForSize(paramsForLevel(level).gridSize)).toBeLessThanOrEqual(4);
    }
  });
});
