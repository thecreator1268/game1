import type { Reminder } from '@/db/types';

// When a reminder is due today, in epoch ms (null if its schedule can't be
// parsed). Medicine/hydration/activity recur daily off a plain "HH:MM";
// appointments carry a one-time ISO datetime. Pure and dependency-free so both
// the local-notification watcher and the spoken cue share one definition.
export function dueAtMs(reminder: Pick<Reminder, 'category' | 'schedule'>, now: Date = new Date()): number | null {
  if (reminder.category === 'appointment') {
    const parsed = Date.parse(reminder.schedule);
    return Number.isNaN(parsed) ? null : parsed;
  }
  const [hours, minutes] = reminder.schedule.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0).getTime();
}
