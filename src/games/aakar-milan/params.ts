// L1=2x2/3 · L2=2x2/4 · L3=3x3/3 · L4=3x3/4 · L5=3x3/5 · L6=4x4/4 · L7=4x4/5 · L8=4x4/6 · L9=5x5/6 · L10=5x5/6
const LEVELS: Record<number, { size: number; options: number }> = {
  1: { size: 2, options: 3 },
  2: { size: 2, options: 4 },
  3: { size: 3, options: 3 },
  4: { size: 3, options: 4 },
  5: { size: 3, options: 5 },
  6: { size: 4, options: 4 },
  7: { size: 4, options: 5 },
  8: { size: 4, options: 6 },
  9: { size: 5, options: 6 },
  10: { size: 5, options: 6 },
};

export function paramsForLevel(level: number) {
  return LEVELS[level] ?? LEVELS[1];
}

export const SHAPES = ['▲', '●', '■', '◆', '★', '⬟'];
export const TRIALS_PER_SESSION = 5;
