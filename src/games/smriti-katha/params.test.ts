import { describe, expect, it } from 'vitest';
import { paramsForLevel } from './params';
import { STORIES } from './stories';

describe('paramsForLevel', () => {
  const maxSentences = Math.max(...STORIES.map((s) => s.sentences.length));
  const maxQuestions = Math.max(...STORIES.map((s) => s.questions.length));

  it('never requests more sentences or questions than any story actually has', () => {
    for (let level = 1; level <= 10; level++) {
      const { sentences, questions } = paramsForLevel(level);
      expect(sentences).toBeLessThanOrEqual(maxSentences);
      expect(questions).toBeLessThanOrEqual(maxQuestions);
    }
  });
});
