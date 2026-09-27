import { describe, expect, it } from 'vitest';
import { gridForLevel } from './params';

describe('gridForLevel', () => {
  it('never asks for more than 4 columns, so the assembly grid fits a phone-width viewport', () => {
    // Unlike a plain content grid, this game's column count can't be capped
    // at render time — buildMosaic() generates the picture from the exact
    // rows×cols shape, so a mismatched render would misalign every slot's
    // correct piece. The cap has to live in the level table itself.
    // Confirmed via a real mobile Playwright check: the old L10 (4 rows x 7
    // cols) overflowed a 360px viewport by ~90px.
    for (let level = 1; level <= 10; level++) {
      expect(gridForLevel(level).cols).toBeLessThanOrEqual(4);
    }
  });

  it('still increases total pieces with level', () => {
    const totalPieces = (level: number) => {
      const { rows, cols } = gridForLevel(level);
      return rows * cols;
    };
    for (let level = 2; level <= 10; level++) {
      expect(totalPieces(level)).toBeGreaterThan(totalPieces(level - 1));
    }
  });
});
