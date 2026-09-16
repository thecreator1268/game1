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

export function cardCountForLevel(level: number): number {
  return CARD_COUNT_BY_LEVEL[level] ?? CARD_COUNT_BY_LEVEL[1];
}
