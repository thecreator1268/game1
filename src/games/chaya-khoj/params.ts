// L1=2 · L2=2 · L3=3 · L4=3 · L5=4 · L6=4 · L7=5 · L8=5 · L9=6 · L10=6 (distractor shadows shown)
const DISTRACTORS_BY_LEVEL: Record<number, number> = {
  1: 2,
  2: 2,
  3: 3,
  4: 3,
  5: 4,
  6: 4,
  7: 5,
  8: 5,
  9: 6,
  10: 6,
};

export function distractorsForLevel(level: number): number {
  return DISTRACTORS_BY_LEVEL[level] ?? DISTRACTORS_BY_LEVEL[1];
}

export const OBJECT_POOL = ['🐘', '🚲', '☂️', '🪑', '🎸', '🐦', '🏠', '🌳', '🐕', '🚗', '⚽', '🔑'];
export const TRIALS_PER_SESSION = 5;
