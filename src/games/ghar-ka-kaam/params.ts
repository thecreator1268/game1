// L1=3/1 · L2=3/2 · L3=4/2 · L4=4/3 · L5=5/3 · L6=5/4 · L7=6/4 · L8=6/5 · L9=7/5 · L10=7/6 (pairs / distractor tools)
const LEVELS: Record<number, { pairs: number; distractors: number }> = {
  1: { pairs: 3, distractors: 1 },
  2: { pairs: 3, distractors: 2 },
  3: { pairs: 4, distractors: 2 },
  4: { pairs: 4, distractors: 3 },
  5: { pairs: 5, distractors: 3 },
  6: { pairs: 5, distractors: 4 },
  7: { pairs: 6, distractors: 4 },
  8: { pairs: 6, distractors: 5 },
  9: { pairs: 7, distractors: 5 },
  10: { pairs: 7, distractors: 6 },
};

export function paramsForLevel(level: number) {
  return LEVELS[level] ?? LEVELS[1];
}
