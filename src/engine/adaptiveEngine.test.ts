import { describe, expect, it } from 'vitest';
import {
  decideNextLevel,
  isPersonalBest,
  LEVEL_DOWN_MASTERY_THRESHOLD,
  LEVEL_UP_MASTERY_THRESHOLD,
  MAX_LEVEL,
  MIN_LEVEL,
} from './adaptiveEngine';
import type { AttemptResult } from './adaptiveEngine';
import { replayMastery } from './bkt';

function attempt(accuracy: number, avgResponseMs: number, timestamp = 0): AttemptResult {
  return { accuracy, avgResponseMs, timestamp };
}

// The mastery estimate the service would hold after playing exactly this history.
function masteryOf(history: AttemptResult[]): number {
  return replayMastery(history.map((h) => h.accuracy));
}

// Improving response time, so the level-up time gate is satisfied.
const IMPROVING = [5000, 4500, 4000, 3000, 2500];
const withAccuracy = (accuracy: number, times = IMPROVING) => times.map((ms) => attempt(accuracy, ms));

describe('decideNextLevel', () => {
  it('holds with no attempts', () => {
    const result = decideNextLevel(3, [], 0.3);
    expect(result.changed).toBe(false);
    expect(result.direction).toBe('hold');
  });

  it('holds while gathering data below the window size', () => {
    const history = [attempt(1, 2000), attempt(1, 2000)];
    const result = decideNextLevel(3, history, masteryOf(history));
    expect(result.changed).toBe(false);
    expect(result.reason).toContain('gathering data (2/5');
  });

  it('levels up on high mastery with improving response time', () => {
    const history = [
      attempt(1, 5000),
      attempt(1, 4500),
      attempt(0.8, 4000),
      attempt(1, 3000),
      attempt(1, 2500),
    ];
    const result = decideNextLevel(3, history, masteryOf(history));
    expect(result.direction).toBe('up');
    expect(result.newLevel).toBe(4);
    expect(result.reason).toMatch(
      /^leveled up: domain mastery estimate \d\.\d\d \(at least 0\.80\) and this game's own last 5 sessions averaged \d+% \(at least 80%\); avg \d\.\ds$/,
    );
  });

  it('holds on high mastery when response time is not improving', () => {
    const history = [
      attempt(1, 2000),
      attempt(1, 2200),
      attempt(1, 2000),
      attempt(1, 3000),
      attempt(1, 3200),
    ];
    const result = decideNextLevel(3, history, masteryOf(history));
    expect(result.direction).toBe('hold');
    expect(result.changed).toBe(false);
    expect(result.reason).toContain('response time not yet improving');
  });

  it('levels down when the mastery estimate is below 0.40', () => {
    const history = [
      attempt(0.2, 5000),
      attempt(0.4, 5000),
      attempt(0.2, 5000),
      attempt(0.4, 5000),
      attempt(0.2, 5000),
    ];
    const result = decideNextLevel(4, history, masteryOf(history));
    expect(result.direction).toBe('down');
    expect(result.newLevel).toBe(3);
    expect(result.reason).toMatch(
      /^leveled down: domain mastery estimate 0\.\d\d \(below 0\.40\); this game's last 5 sessions: \d correct, \d incorrect$/,
    );
  });

  it('holds on middling mastery between 0.40 and 0.80', () => {
    const history = withAccuracy(0.6, [3000, 3000, 3000, 3000, 3000]);
    const result = decideNextLevel(4, history, masteryOf(history));
    expect(result.direction).toBe('hold');
    expect(result.reason).toContain('(between 0.40 and 0.80)');
  });

  it('levels down early on 2 consecutive sessions of rising error rate, before a full window', () => {
    const history = [attempt(1, 2000), attempt(0.6, 2000), attempt(0.2, 2000)];
    // mastery is irrelevant to this rule: even a high estimate does not stop it
    const result = decideNextLevel(5, history, 0.9);
    expect(result.direction).toBe('down');
    expect(result.newLevel).toBe(4);
    expect(result.reason).toContain('error rate rose');
  });

  it('does not trigger the rising-error rule when error rate is not strictly increasing', () => {
    const history = [attempt(0.6, 2000), attempt(0.2, 2000), attempt(0.4, 2000)];
    const result = decideNextLevel(5, history, masteryOf(history));
    expect(result.reason).not.toContain('error rate rose');
  });

  it('clamps at MAX_LEVEL and reports unchanged', () => {
    const history = withAccuracy(1);
    const result = decideNextLevel(MAX_LEVEL, history, masteryOf(history));
    expect(result.newLevel).toBe(MAX_LEVEL);
    expect(result.changed).toBe(false);
  });

  it('clamps at MIN_LEVEL and reports unchanged', () => {
    const history = withAccuracy(0.1, [5000, 5000, 5000, 5000, 5000]);
    const result = decideNextLevel(MIN_LEVEL, history, masteryOf(history));
    expect(result.newLevel).toBe(MIN_LEVEL);
    expect(result.changed).toBe(false);
  });

  it('uses the window for the tally and time trend, and mastery for the decision', () => {
    const history = [
      attempt(0, 9000),
      attempt(0, 9000),
      attempt(0, 9000),
      // last 5 below are all perfect + improving
      attempt(1, 5000),
      attempt(1, 4500),
      attempt(1, 4000),
      attempt(1, 3000),
      attempt(1, 2500),
    ];
    const result = decideNextLevel(2, history, masteryOf(history));
    expect(result.direction).toBe('up');
    // only the last 5 sessions count toward the game's own average
    expect(result.reason).toContain("this game's own last 5 sessions averaged 100%");
  });
});

describe("a level-up also needs this game's own last 5 sessions at 80%+", () => {
  it('an easy game at 100% alternating with a hard game at 45% does not level up the hard game', () => {
    // Play order: easy, hard, easy, hard, ... The domain estimate is shared by both.
    const easy = 1;
    const hard = 0.45;
    const played = Array.from({ length: 5 }, () => [easy, hard]).flat();
    const shared = replayMastery(played);
    // The premise: the shared estimate alone would clear the 0.80 bar...
    expect(shared).toBeGreaterThanOrEqual(LEVEL_UP_MASTERY_THRESHOLD);

    // ...but the hard game's own window is 45%, with response times improving so
    // the time gate is not what blocks it.
    const hardHistory = withAccuracy(hard);
    const result = decideNextLevel(6, hardHistory, shared);
    expect(result.direction).toBe('hold');
    expect(result.changed).toBe(false);
    expect(result.newLevel).toBe(6);
    expect(result.reason).toContain(`domain mastery estimate ${shared.toFixed(2)} (at least 0.80)`);
    expect(result.reason).toContain("this game's own last 5 sessions averaged 45% (below 80%)");
  });

  it('the easy game itself still levels up in that same mix', () => {
    const played = Array.from({ length: 5 }, () => [1, 0.45]).flat();
    const shared = replayMastery(played);
    const result = decideNextLevel(2, withAccuracy(1), shared);
    expect(result.direction).toBe('up');
  });

  it('logs both conditions when it levels up', () => {
    const result = decideNextLevel(4, withAccuracy(0.84), 0.91);
    expect(result.direction).toBe('up');
    expect(result.reason).toBe(
      "leveled up: domain mastery estimate 0.91 (at least 0.80) and this game's own last 5 sessions averaged 84% (at least 80%); avg 3.8s",
    );
  });

  it('is inclusive at exactly 80% and holds just under it', () => {
    expect(decideNextLevel(4, withAccuracy(0.8), 0.9).direction).toBe('up');
    const under = decideNextLevel(4, withAccuracy(0.796), 0.9);
    expect(under.direction).toBe('hold');
    // 79.6% is shown as 79%, never rounded up to a bar it did not meet
    expect(under.reason).toContain('averaged 79% (below 80%)');
  });

  it('the level-down side is untouched: a low estimate still levels down whatever the game window says', () => {
    expect(decideNextLevel(4, withAccuracy(1), 0.3).direction).toBe('down');
  });
});

describe('the mastery estimate is what feeds the thresholds', () => {
  // Identical attempt history every time; only the estimate changes.
  const history = withAccuracy(1);

  it('a high estimate levels up, a middling one holds, a low one levels down', () => {
    expect(decideNextLevel(4, history, 0.9).direction).toBe('up');
    expect(decideNextLevel(4, history, 0.6).direction).toBe('hold');
    expect(decideNextLevel(4, history, 0.2).direction).toBe('down');
  });

  it('the raw accuracy of the window no longer decides anything by itself', () => {
    // Perfect accuracy, but the estimate says otherwise: not a level-up.
    expect(decideNextLevel(4, history, 0.5).direction).toBe('hold');
  });

  it('uses the documented cut-offs exactly: >= 0.80 up, < 0.40 down', () => {
    expect(LEVEL_UP_MASTERY_THRESHOLD).toBe(0.8);
    expect(LEVEL_DOWN_MASTERY_THRESHOLD).toBe(0.4);
    expect(decideNextLevel(4, history, 0.8).direction).toBe('up');
    expect(decideNextLevel(4, history, 0.7999).direction).toBe('hold');
    expect(decideNextLevel(4, history, 0.4).direction).toBe('hold');
    expect(decideNextLevel(4, history, 0.3999).direction).toBe('down');
  });

  it('a steady 55-70% patient holds instead of being promoted or demoted', () => {
    for (const accuracy of [0.55, 0.6, 0.7]) {
      const steady = withAccuracy(accuracy);
      expect(decideNextLevel(4, steady, masteryOf(steady)).direction).toBe('hold');
    }
  });

  it('a steady 80%+ patient with improving times levels up; a steady 30% patient levels down', () => {
    const strong = withAccuracy(0.85);
    const struggling = withAccuracy(0.3);
    expect(decideNextLevel(4, strong, masteryOf(strong)).direction).toBe('up');
    expect(decideNextLevel(4, struggling, masteryOf(struggling)).direction).toBe('down');
  });

  it('every decision that changes the level says so in a human-readable reason', () => {
    const up = decideNextLevel(4, history, 0.91);
    const down = decideNextLevel(4, history, 0.2);
    expect(up.reason).toContain('mastery estimate 0.91');
    expect(down.reason).toContain('mastery estimate 0.20');
  });
});

describe('isPersonalBest', () => {
  it('is true at level 6 and above', () => {
    expect(isPersonalBest(6)).toBe(true);
    expect(isPersonalBest(8)).toBe(true);
  });

  it('is false below level 6', () => {
    expect(isPersonalBest(5)).toBe(false);
    expect(isPersonalBest(1)).toBe(false);
  });
});
