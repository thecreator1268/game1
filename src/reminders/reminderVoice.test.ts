// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  REMINDER_REPLAY_AFTER_MS,
  historyKey,
  readHistory,
  reminderVoiceAction,
  writeHistory,
} from './reminderVoice';

const at = (h: number, m = 0) => new Date(2026, 8, 21, h, m, 0, 0).getTime();
const reminder = (over: Partial<Parameters<typeof reminderVoiceAction>[0]> = {}) => ({
  category: 'medicine' as const,
  schedule: '09:00',
  takenToday: false,
  ...over,
});

describe('reminderVoiceAction', () => {
  it('stays silent before the reminder is due', () => {
    expect(reminderVoiceAction(reminder(), at(8, 59))).toBeNull();
  });

  it('cues once when it comes due', () => {
    expect(reminderVoiceAction(reminder(), at(9, 0))).toBe('cue');
  });

  it('never speaks for a reminder that is already done', () => {
    expect(reminderVoiceAction(reminder({ takenToday: true }), at(9, 30))).toBeNull();
  });

  it('does not repeat before the replay window has passed', () => {
    const entry = { count: 1, lastAt: at(9, 0) };
    expect(reminderVoiceAction(reminder(), at(9, 0) + REMINDER_REPLAY_AFTER_MS - 1, entry)).toBeNull();
  });

  it('replays exactly once, after the window, if still unacknowledged', () => {
    const cued = { count: 1, lastAt: at(9, 0) };
    const when = at(9, 0) + REMINDER_REPLAY_AFTER_MS;
    expect(reminderVoiceAction(reminder(), when, cued)).toBe('replay');

    const replayed = { count: 2, lastAt: when };
    expect(reminderVoiceAction(reminder(), when + 60 * 60_000, replayed)).toBeNull();
  });

  it('handles one-time appointments by their own datetime', () => {
    const appt = reminder({ category: 'appointment', schedule: new Date(2026, 8, 21, 15, 0).toISOString() });
    expect(reminderVoiceAction(appt, at(14, 59))).toBeNull();
    expect(reminderVoiceAction(appt, at(15, 0))).toBe('cue');
  });

  it('ignores a schedule it cannot parse', () => {
    expect(reminderVoiceAction(reminder({ schedule: 'soon' }), at(12))).toBeNull();
  });
});

describe('voice history', () => {
  beforeEach(() => localStorage.clear());

  it('persists per reminder per day and drops other days', () => {
    const today = at(10);
    const yesterday = today - 24 * 60 * 60_000;
    writeHistory({
      [historyKey('a', today)]: { count: 1, lastAt: today },
      [historyKey('b', yesterday)]: { count: 2, lastAt: yesterday },
    });

    const read = readHistory(today);
    expect(read[historyKey('a', today)]).toEqual({ count: 1, lastAt: today });
    expect(Object.keys(read)).toHaveLength(1);
  });

  it('survives corrupt storage', () => {
    localStorage.setItem('smritisetu.reminderVoice.v1', '{not json');
    expect(readHistory(at(10))).toEqual({});
  });
});
