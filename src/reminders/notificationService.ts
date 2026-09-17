import i18n from '@/i18n';
import { getTodaysReminders, type TodayReminderView } from './reminderService';

// Local (not push) notifications: fires only while this tab/PWA is alive on
// this device, which matches the real usage pattern (a tablet propped up at
// home most of the day) without needing a backend or the Push API's server
// key exchange. It cannot wake a fully closed browser — that's a real
// limitation, not hidden from the caregiver (see the Settings copy).

const DUE_WINDOW_MS = 5 * 60 * 1000;
const CHECK_INTERVAL_MS = 60_000;

// Resets on reload, which is fine: worst case is one reminder re-alerting
// after a page refresh, not a missed one.
const notifiedKeys = new Set<string>();

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  return Notification.requestPermission();
}

function dueAtMs(reminder: TodayReminderView): number | null {
  if (reminder.category === 'appointment') {
    const parsed = Date.parse(reminder.schedule);
    return Number.isNaN(parsed) ? null : parsed;
  }
  const [hours, minutes] = reminder.schedule.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0).getTime();
}

export async function checkDueReminders(patientId: string): Promise<void> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const reminders = await getTodaysReminders(patientId);
  const now = Date.now();

  for (const reminder of reminders) {
    if (reminder.takenToday) continue;
    const due = dueAtMs(reminder);
    if (due === null || now < due || now - due > DUE_WINDOW_MS) continue;

    const key = `${reminder.id}-${new Date(due).toDateString()}`;
    if (notifiedKeys.has(key)) continue;
    notifiedKeys.add(key);

    new Notification(i18n.t('reminders.notificationTitle', { label: reminder.label }), {
      body: i18n.t(`reminders.${reminder.category}`),
      tag: key,
    });
  }
}

export function startReminderWatcher(patientId: string): () => void {
  if (typeof window === 'undefined') return () => {};
  const trigger = () => void checkDueReminders(patientId);
  trigger();
  const interval = window.setInterval(trigger, CHECK_INTERVAL_MS);
  return () => window.clearInterval(interval);
}
