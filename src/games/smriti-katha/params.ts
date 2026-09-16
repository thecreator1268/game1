// L1=2/1 · L2=2/2 · L3=3/2 · L4=3/3 · L5=4/3 · L6=4/4 · L7=5/4 · L8=5/5 · L9=6/5 · L10=6/6 (sentences/questions)
const LEVELS: Record<number, { sentences: number; questions: number }> = {
  1: { sentences: 2, questions: 1 },
  2: { sentences: 2, questions: 2 },
  3: { sentences: 3, questions: 2 },
  4: { sentences: 3, questions: 3 },
  5: { sentences: 4, questions: 3 },
  6: { sentences: 4, questions: 4 },
  7: { sentences: 5, questions: 4 },
  8: { sentences: 5, questions: 5 },
  9: { sentences: 6, questions: 5 },
  10: { sentences: 6, questions: 6 },
};

export function paramsForLevel(level: number) {
  return LEVELS[level] ?? LEVELS[1];
}
