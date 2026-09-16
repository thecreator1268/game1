import { describe, expect, it } from 'vitest';
import { decideNextLevel, isPersonalBest, MAX_LEVEL, MIN_LEVEL } from './adaptiveEngine';
import type { AttemptResult } from './adaptiveEngine';

function attempt(accuracy: number, avgResponseMs: number, timestamp = 0): AttemptResult {
  return { accuracy, avgResponseMs, timestamp };
}

describe('decideNextLevel', () => {
  it('holds with no attempts', () => {
    const result = decideNextLevel(3, []);
    expect(result.changed).toBe(false);
    expect(result.direction).toBe('hold');
  });

  it('holds while gathering data below the window size', () => {
    const history = [attempt(1, 2000), attempt(1, 2000)];
    const result = decideNextLevel(3, history);
    expect(result.changed).toBe(false);
    expect(result.reason).toContain('gathering data (2/5');
  });

  it('levels up on high accuracy with improving response time', () => {
    const history = [
      attempt(1, 5000),
      attempt(1, 4500),
      attempt(0.8, 4000),
      attempt(1, 3000),
      attempt(1, 2500),
    ];
    const result = decideNextLevel(3, history);
    expect(result.direction).toBe('up');
    expect(result.newLevel).toBe(4);
    expect(result.reason).toMatch(/leveled up: \d\/5 correct/);
  });

  it('holds on high accuracy when response time is not improving', () => {
    const history = [
      attempt(1, 2000),
      attempt(1, 2200),
      attempt(1, 2000),
      attempt(1, 3000),
      attempt(1, 3200),
    ];
    const result = decideNextLevel(3, history);
    expect(result.direction).toBe('hold');
    expect(result.changed).toBe(false);
  });

  it('levels down when average accuracy is below 40%', () => {
    const history = [
      attempt(0.2, 5000),
      attempt(0.4, 5000),
      attempt(0.2, 5000),
      attempt(0.4, 5000),
      attempt(0.2, 5000),
    ];
    const result = decideNextLevel(4, history);
    expect(result.direction).toBe('down');
    expect(result.newLevel).toBe(3);
    expect(result.reason).toContain('below 40% threshold');
  });

  it('holds on middling accuracy between 40% and 80%', () => {
    const history = [
      attempt(0.6, 3000),
      attempt(0.6, 3000),
      attempt(0.6, 3000),
      attempt(0.6, 3000),
      attempt(0.6, 3000),
    ];
    const result = decideNextLevel(4, history);
    expect(result.direction).toBe('hold');
  });

  it('levels down early on 2 consecutive sessions of rising error rate, before a full window', () => {
    const history = [attempt(1, 2000), attempt(0.6, 2000), attempt(0.2, 2000)];
    const result = decideNextLevel(5, history);
    expect(result.direction).toBe('down');
    expect(result.newLevel).toBe(4);
    expect(result.reason).toContain('error rate rose');
  });

  it('does not trigger the rising-error rule when error rate is not strictly increasing', () => {
    const history = [attempt(0.6, 2000), attempt(0.2, 2000), attempt(0.4, 2000)];
    const result = decideNextLevel(5, history);
    expect(result.reason).not.toContain('error rate rose');
  });

  it('clamps at MAX_LEVEL and reports unchanged', () => {
    const history = [
      attempt(1, 5000),
      attempt(1, 4500),
      attempt(1, 4000),
      attempt(1, 3000),
      attempt(1, 2500),
    ];
    const result = decideNextLevel(MAX_LEVEL, history);
    expect(result.newLevel).toBe(MAX_LEVEL);
    expect(result.changed).toBe(false);
  });

  it('clamps at MIN_LEVEL and reports unchanged', () => {
    const history = [
      attempt(0.1, 5000),
      attempt(0.1, 5000),
      attempt(0.1, 5000),
      attempt(0.1, 5000),
      attempt(0.1, 5000),
    ];
    const result = decideNextLevel(MIN_LEVEL, history);
    expect(result.newLevel).toBe(MIN_LEVEL);
    expect(result.changed).toBe(false);
  });

  it('only considers the most recent WINDOW_SIZE attempts', () => {
    const history = [
      attempt(0, 9000),
      attempt(0, 9000),
      attempt(0, 9000),
      // last 5 below are all perfect + improving, should drive the decision
      attempt(1, 5000),
      attempt(1, 4500),
      attempt(1, 4000),
      attempt(1, 3000),
      attempt(1, 2500),
    ];
    const result = decideNextLevel(2, history);
    expect(result.direction).toBe('up');
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
