import { describe, expect, it } from 'vitest';
import { computeGardenGrowth, MAX_GARDEN_STAGE } from './gardenGrowth';

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(now: number, days: number): number {
  return now - days * DAY;
}

describe('computeGardenGrowth', () => {
  it('returns stage 0 with no sessions', () => {
    const result = computeGardenGrowth([], 12, Date.now());
    expect(result.consistentWeeks).toBe(0);
    expect(result.stage).toBe(0);
  });

  it('does not count a week with fewer than 3 played days', () => {
    const now = Date.now();
    const timestamps = [daysAgo(now, 0), daysAgo(now, 1)];
    const result = computeGardenGrowth(timestamps, 12, now);
    expect(result.consistentWeeks).toBe(0);
  });

  it('counts a week with 3+ played days as consistent', () => {
    const now = Date.now();
    const timestamps = [daysAgo(now, 0), daysAgo(now, 1), daysAgo(now, 2)];
    const result = computeGardenGrowth(timestamps, 12, now);
    expect(result.consistentWeeks).toBe(1);
    expect(result.stage).toBe(1);
  });

  it('counts multiple non-consecutive consistent weeks', () => {
    const now = Date.now();
    const week0 = [daysAgo(now, 0), daysAgo(now, 1), daysAgo(now, 2)];
    const week2 = [daysAgo(now, 14), daysAgo(now, 15), daysAgo(now, 16), daysAgo(now, 17)];
    const result = computeGardenGrowth([...week0, ...week2], 12, now);
    expect(result.consistentWeeks).toBe(2);
  });

  it('caps the stage at MAX_GARDEN_STAGE even with many consistent weeks', () => {
    const now = Date.now();
    const timestamps: number[] = [];
    for (let week = 0; week < 12; week++) {
      for (let day = 0; day < 4; day++) {
        timestamps.push(daysAgo(now, week * 7 + day));
      }
    }
    const result = computeGardenGrowth(timestamps, 12, now);
    expect(result.consistentWeeks).toBe(12);
    expect(result.stage).toBe(MAX_GARDEN_STAGE);
  });

  it('only counts multiple sessions on the same day once toward the 3-day threshold', () => {
    const now = Date.now();
    const timestamps = [daysAgo(now, 0), daysAgo(now, 0) - 1000, daysAgo(now, 1)];
    const result = computeGardenGrowth(timestamps, 12, now);
    expect(result.consistentWeeks).toBe(0);
  });
});
