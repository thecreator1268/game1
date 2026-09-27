import { describe, expect, it } from 'vitest';
import { CARD_ITEMS } from './items';
import { gridColumnsForPairCount, pairsForLevel } from './params';

describe('pairsForLevel', () => {
  it('never requests more pairs than there are unique card items', () => {
    // buildDeck() picks `pairCount` distinct items from CARD_ITEMS and
    // relies on Array.slice, which silently clamps to a smaller deck if
    // pairCount exceeds the pool — but the round-completion check and the
    // "X of Y pairs found" counter both use pairCount directly, so a round
    // that asks for more pairs than exist could never finish. See MAX_LEVEL
    // in adaptiveEngine.ts for the levels this must hold at.
    for (let level = 1; level <= 10; level++) {
      expect(pairsForLevel(level)).toBeLessThanOrEqual(CARD_ITEMS.length);
    }
  });

  it('still increases with level up to the pool size', () => {
    expect(pairsForLevel(1)).toBeLessThan(pairsForLevel(5));
    expect(pairsForLevel(5)).toBeLessThanOrEqual(pairsForLevel(10));
  });
});

describe('gridColumnsForPairCount', () => {
  it('never exceeds 4 columns, so a 64px tap-target grid fits a phone-width viewport', () => {
    // 5+ columns of 64px minimum-width cards (plus gaps) overflow a
    // ~360-375px phone viewport, since a CSS Grid track can't shrink a
    // child below its own enforced min-width — confirmed via a real mobile
    // Playwright check (scrollWidth > clientWidth at 5-6 columns).
    for (let pairCount = 1; pairCount <= CARD_ITEMS.length; pairCount++) {
      expect(gridColumnsForPairCount(pairCount)).toBeLessThanOrEqual(4);
    }
  });
});
