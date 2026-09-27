import { ROUTINE_ITEMS } from './items';

// L1=3 · L2=4 · L3=5 · L4=6 · L5=7 · L6=8 · L7=9 · L8=10 · L9=11 · L10=12
const CARD_COUNT_BY_LEVEL: Record<number, number> = {
  1: 3,
  2: 4,
  3: 5,
  4: 6,
  5: 7,
  6: 8,
  7: 9,
  8: 10,
  9: 11,
  10: 12,
};

// Clamped to the routine-item pool size. DinacharyaSequenceGame.tsx derives
// its own completion check from the actual sampled/sliced array's length, so
// asking for more than the pool has never got the round stuck — but L10
// asked for 12 while ROUTINE_ITEMS has only 11, silently delivering the same
// round as L9. Until the pool grows, L10 plateaus at L9's difficulty.
export function cardCountForLevel(level: number): number {
  const requested = CARD_COUNT_BY_LEVEL[level] ?? CARD_COUNT_BY_LEVEL[1];
  return Math.min(requested, ROUTINE_ITEMS.length);
}
