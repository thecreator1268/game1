// L1=8/40 · L2=10/35 · L3=12/30 · L4=14/28 · L5=16/25 · L6=18/22 · L7=20/20 · L8=24/18
const LEVELS: Record<number, { length: number; targetPct: number }> = {
  1: { length: 8, targetPct: 40 },
  2: { length: 10, targetPct: 35 },
  3: { length: 12, targetPct: 30 },
  4: { length: 14, targetPct: 28 },
  5: { length: 16, targetPct: 25 },
  6: { length: 18, targetPct: 22 },
  7: { length: 20, targetPct: 20 },
  8: { length: 24, targetPct: 18 },
};

export function paramsForLevel(level: number) {
  return LEVELS[level] ?? LEVELS[1];
}

export const WORD_POOL = [
  'tea',
  'rice',
  'house',
  'river',
  'mountain',
  'basket',
  'flower',
  'boat',
  'chair',
  'lamp',
  'market',
  'door',
  'tree',
  'window',
  'bridge',
  'garden',
];

export const SLOT_DURATION_MS = 2200;
