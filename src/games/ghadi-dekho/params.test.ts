import { describe, expect, it } from 'vitest';
import { buildClockTrial, formatClockTime, paramsForLevel } from './params';

describe('formatClockTime', () => {
  it('formats midnight/noon (0 minutes) as 12:00', () => {
    expect(formatClockTime(0)).toBe('12:00');
  });

  it('formats a regular time with a padded minute', () => {
    expect(formatClockTime(3 * 60 + 5)).toBe('3:05');
  });

  it('formats the last minute before wrapping', () => {
    expect(formatClockTime(11 * 60 + 59)).toBe('11:59');
  });
});

describe('paramsForLevel', () => {
  it('falls back to level 1 params for an out-of-range level', () => {
    expect(paramsForLevel(999)).toEqual(paramsForLevel(1));
  });

  it('gets easier (fewer options, coarser granularity) at level 1 than level 10', () => {
    const easy = paramsForLevel(1);
    const hard = paramsForLevel(10);
    expect(easy.optionCount).toBeLessThanOrEqual(hard.optionCount);
    expect(easy.granularityMinutes).toBeGreaterThan(hard.granularityMinutes);
  });
});

describe('buildClockTrial', () => {
  it('always includes the correct time among the options', () => {
    for (let level = 1; level <= 10; level++) {
      const trial = buildClockTrial(level);
      expect(trial.optionsMinutes).toContain(trial.totalMinutes);
    }
  });

  it('produces the exact option count for the level, with no duplicates', () => {
    for (let level = 1; level <= 10; level++) {
      const { optionCount } = paramsForLevel(level);
      const trial = buildClockTrial(level);
      expect(trial.optionsMinutes).toHaveLength(optionCount);
      expect(new Set(trial.optionsMinutes).size).toBe(optionCount);
    }
  });

  it('keeps the target time on the level\'s minute granularity', () => {
    for (let level = 1; level <= 10; level++) {
      const { granularityMinutes } = paramsForLevel(level);
      const trial = buildClockTrial(level);
      expect(trial.totalMinutes % granularityMinutes).toBe(0);
    }
  });

  it('keeps every target within a single 12-hour face (0-719 minutes)', () => {
    const trial = buildClockTrial(5);
    expect(trial.totalMinutes).toBeGreaterThanOrEqual(0);
    expect(trial.totalMinutes).toBeLessThan(12 * 60);
  });
});
