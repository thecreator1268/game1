import { db } from '@/db/schema';
import type { Reminder, ReminderCategory } from '@/db/types';
import { newId } from '@/lib/id';
import { syncPendingData } from '@/sync/queue';

function startOfDay(date = new Date()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfDay(date = new Date()): number {
  return startOfDay(date) + 24 * 60 * 60 * 1000 - 1;
}

export interface TodayReminderView extends Reminder {
  takenToday: boolean;
  takenAt?: number;
}

// Medicine/hydration/activity reminders recur daily off a plain "HH:MM"
// schedule; appointments carry a one-time ISO datetime and only surface on
// their actual day.
export async function getTodaysReminders(patientId: string): Promise<TodayReminderView[]> {
  const reminders = await db.reminders.where('patientId').equals(patientId).toArray();
  const active = reminders.filter((r) => r.active);
  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  const relevant = active.filter((r) => {
    if (r.category === 'appointment') {
      const t = Date.parse(r.schedule);
      return !Number.isNaN(t) && t >= todayStart && t <= todayEnd;
    }
    return true;
  });

  const logs = await db.reminderLogs.where('patientId').equals(patientId).toArray();

  return relevant
    .map((r) => {
      const todayLog = logs.find(
        (l) => l.reminderId === r.id && l.acknowledgedAt >= todayStart && l.acknowledgedAt <= todayEnd,
      );
      return { ...r, takenToday: Boolean(todayLog), takenAt: todayLog?.acknowledgedAt };
    })
    .sort((a, b) => a.schedule.localeCompare(b.schedule));
}

export async function markReminderTaken(reminder: Reminder): Promise<void> {
  await db.reminderLogs.add({
    id: newId(),
    reminderId: reminder.id,
    patientId: reminder.patientId,
    acknowledgedAt: Date.now(),
    synced: false,
  });
  await db.reminders.update(reminder.id, { lastAcknowledgedAt: Date.now() });
  void syncPendingData();
}

export interface NewReminderInput {
  patientId: string;
  category: ReminderCategory;
  label: string;
  schedule: string;
  notes?: string;
  photoUrl?: string;
  voiceNoteUrl?: string;
}

export async function addReminder(input: NewReminderInput): Promise<void> {
  await db.reminders.add({
    id: newId(),
    active: true,
    createdAt: Date.now(),
    ...input,
  });
}

export async function updateReminder(id: string, changes: Partial<Reminder>): Promise<void> {
  await db.reminders.update(id, changes);
}

export async function deleteReminder(id: string): Promise<void> {
  await db.reminders.delete(id);
}
