import { describe, expect, it } from 'vitest';
import { computePlayStreak } from './streak';

const DAY = 24 * 60 * 60 * 1000;

describe('computePlayStreak', () => {
  it('returns 0 with no sessions', () => {
    expect(computePlayStreak([])).toBe(0);
  });

  it('counts today alone as a streak of 1', () => {
    const now = Date.now();
    expect(computePlayStreak([now], now)).toBe(1);
  });

  it('counts consecutive days including today', () => {
    const now = Date.now();
    const timestamps = [now, now - DAY, now - 2 * DAY];
    expect(computePlayStreak(timestamps, now)).toBe(3);
  });

  it('does not break the streak if today has no session yet, but yesterday does', () => {
    const now = Date.now();
    const timestamps = [now - DAY, now - 2 * DAY];
    expect(computePlayStreak(timestamps, now)).toBe(2);
  });

  it('resets to 0 once a full day is skipped', () => {
    const now = Date.now();
    const timestamps = [now - 2 * DAY, now - 3 * DAY];
    expect(computePlayStreak(timestamps, now)).toBe(0);
  });

  it('stops counting at the first gap, ignoring older sessions beyond it', () => {
    const now = Date.now();
    const timestamps = [now, now - DAY, now - 3 * DAY, now - 4 * DAY];
    expect(computePlayStreak(timestamps, now)).toBe(2);
  });

  it('counts multiple sessions on the same day only once', () => {
    const now = Date.now();
    const timestamps = [now, now - 1000, now - 2000];
    expect(computePlayStreak(timestamps, now)).toBe(1);
  });
});
