import { STORIES } from './stories';

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

// Clamped to what the story pool actually contains. SmritiKathaGame.tsx
// slices story.sentences/story.questions to these counts and then derives
// its own completion check from the sliced arrays' actual lengths, so
// requesting more than a story has never got the round stuck the way an
// unclamped count did in Smriti Cards — but levels 9-10 were silently
// asking for 6 sentences / 5-6 questions when every story tops out at 5
// sentences / 4 questions, so the level table was lying about what it
// delivered. Until the story pool grows, levels 8-10 plateau at the same
// round as the highest level the pool actually supports.
const MAX_SENTENCES = Math.max(...STORIES.map((s) => s.sentences.length));
const MAX_QUESTIONS = Math.max(...STORIES.map((s) => s.questions.length));

export function paramsForLevel(level: number) {
  const { sentences, questions } = LEVELS[level] ?? LEVELS[1];
  return {
    sentences: Math.min(sentences, MAX_SENTENCES),
    questions: Math.min(questions, MAX_QUESTIONS),
  };
}
