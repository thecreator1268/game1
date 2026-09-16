// L1=3 · L2=4 · L3=5 · L4=6 · L5=8 · L6=9 · L7=10 · L8=12
const PAIRS_BY_LEVEL: Record<number, number> = {
  1: 3,
  2: 4,
  3: 5,
  4: 6,
  5: 8,
  6: 9,
  7: 10,
  8: 12,
};

export function pairsForLevel(level: number): number {
  return PAIRS_BY_LEVEL[level] ?? PAIRS_BY_LEVEL[1];
}

export function gridColumnsForPairCount(pairCount: number): number {
  const totalCards = pairCount * 2;
  if (totalCards <= 6) return 3;
  if (totalCards <= 12) return 4;
  if (totalCards <= 18) return 5;
  return 6;
}
