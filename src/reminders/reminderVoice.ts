import { dueAtMs } from './dueTime';
import type { TodayReminderView } from './reminderService';

// A spoken cue for a reminder on the patient's Today list, then exactly one
// gentle replay if it is still unacknowledged well past its time — never a
// nag. Re-presenting an instruction the patient may have missed follows the
// ADRD usability review's "repeating instructions" suggestion (Engelsma et al.
// 2021, src/lib/evidence.ts), and a hard cap of two plays per reminder per day
// keeps it calm rather than urgent. (Before this, a due reminder was only a
// visual card plus an optional browser notification — it never spoke.)

/** Wait after the first cue before the single replay. */
export const REMINDER_REPLAY_AFTER_MS = 10 * 60_000;

export interface VoiceEntry {
  count: number;
  lastAt: number;
}
export type VoiceHistory = Record<string, VoiceEntry>;
export type ReminderVoiceAction = 'cue' | 'replay' | null;

/**
 * Pure decision: should this reminder be spoken now, and which line?
 * `cue` the first time it is due and not yet done; `replay` once, at least
 * REMINDER_REPLAY_AFTER_MS after the cue; otherwise nothing.
 */
export function reminderVoiceAction(
  reminder: Pick<TodayReminderView, 'category' | 'schedule' | 'takenToday'>,
  now: number,
  entry?: VoiceEntry,
): ReminderVoiceAction {
  if (reminder.takenToday) return null;
  const due = dueAtMs(reminder, new Date(now));
  if (due === null || now < due) return null;
  if (!entry || entry.count === 0) return 'cue';
  if (entry.count === 1 && now - entry.lastAt >= REMINDER_REPLAY_AFTER_MS) return 'replay';
  return null;
}

// Survives navigating away from Today and page reloads, so leaving and coming
// back doesn't re-speak. Keyed per reminder per calendar day; entries from
// other days are dropped on read.
const STORAGE_KEY = 'smritisetu.reminderVoice.v1';

export function historyKey(reminderId: string, now: number): string {
  return `${reminderId}:${new Date(now).toDateString()}`;
}

export function readHistory(now: number): VoiceHistory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as VoiceHistory) : {};
    const suffix = `:${new Date(now).toDateString()}`;
    return Object.fromEntries(Object.entries(parsed).filter(([key]) => key.endsWith(suffix)));
  } catch {
    return {};
  }
}

export function writeHistory(history: VoiceHistory): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Storage blocked: worst case a cue repeats after a reload, never a crash.
  }
}
