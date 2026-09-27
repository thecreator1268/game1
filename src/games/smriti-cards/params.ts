import { CARD_ITEMS } from './items';

// L1=3 · L2=4 · L3=5 · L4=6 · L5=8 · L6=9 · L7=10 · L8=12 · L9=14 · L10=16
const PAIRS_BY_LEVEL: Record<number, number> = {
  1: 3,
  2: 4,
  3: 5,
  4: 6,
  5: 8,
  6: 9,
  7: 10,
  8: 12,
  9: 14,
  10: 16,
};

// Clamped to the card-face pool size: buildDeck() picks `pairCount` distinct
// items from CARD_ITEMS, so requesting more pairs than there are unique
// items would silently deal a smaller deck (Array.slice clamps) while the
// UI's "X of Y pairs found" counter and round-completion check still used
// the original, larger number — the round could never finish. Until the
// placeholder art pool grows past CARD_ITEMS.length, levels 9-10 plateau at
// the same board as the highest level the pool actually supports.
export function pairsForLevel(level: number): number {
  const requested = PAIRS_BY_LEVEL[level] ?? PAIRS_BY_LEVEL[1];
  return Math.min(requested, CARD_ITEMS.length);
}

// Capped at 4 columns regardless of card count: each card is a tap-target
// (64px minimum, non-negotiable per the accessibility rules), and at a
// phone-width viewport (~360-375px of usable width) a 5th or 6th fixed-min
// -width column no longer fits — the grid overflowed horizontally instead
// of shrinking, since a CSS Grid track can't shrink a child below its own
// enforced min-width. More cards now means more rows, never narrower ones.
export function gridColumnsForPairCount(pairCount: number): number {
  const totalCards = pairCount * 2;
  if (totalCards <= 6) return 3;
  return 4;
}
