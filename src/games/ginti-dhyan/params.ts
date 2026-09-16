// L1=5,by1 · L2=6,by1 · L3=7,by1 · L4=8,by1 · L5=8,by2 · L6=10,by2 · L7=12,by2 · L8=12,by3 · L9=14,by3 · L10=15,by4
const LEVELS: Record<number, { length: number; step: number }> = {
  1: { length: 5, step: 1 },
  2: { length: 6, step: 1 },
  3: { length: 7, step: 1 },
  4: { length: 8, step: 1 },
  5: { length: 8, step: 2 },
  6: { length: 10, step: 2 },
  7: { length: 12, step: 2 },
  8: { length: 12, step: 3 },
  9: { length: 14, step: 3 },
  10: { length: 15, step: 4 },
};

export function paramsForLevel(level: number) {
  return LEVELS[level] ?? LEVELS[1];
}

export function gridColumnsForLength(length: number): number {
  if (length <= 6) return 3;
  if (length <= 9) return 4;
  return 4;
}
