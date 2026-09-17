// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/i18n';
import type { TodayReminderView } from './reminderService';
import { checkDueReminders } from './notificationService';

const getTodaysRemindersMock = vi.fn<(patientId: string) => Promise<TodayReminderView[]>>();
// Hoisted above these imports by vitest, so notificationService already
// resolves against the mocked reminderService module.
vi.mock('./reminderService', () => ({
  getTodaysReminders: (patientId: string) => getTodaysRemindersMock(patientId),
}));

class MockNotification {
  static permission: NotificationPermission = 'granted';
  static instances: Array<{ title: string; options?: NotificationOptions }> = [];
  constructor(title: string, options?: NotificationOptions) {
    MockNotification.instances.push({ title, options });
  }
}

function reminder(overrides: Partial<TodayReminderView>): TodayReminderView {
  return {
    id: 'reminder-id',
    patientId: 'p1',
    category: 'medicine',
    label: 'Blood pressure pill',
    schedule: '09:00',
    active: true,
    createdAt: 0,
    takenToday: false,
    ...overrides,
  };
}

describe('checkDueReminders', () => {
  beforeEach(() => {
    vi.stubGlobal('Notification', MockNotification);
    MockNotification.permission = 'granted';
    MockNotification.instances = [];
    getTodaysRemindersMock.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 9, 0, 0));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('fires a notification for a reminder due right now', async () => {
    getTodaysRemindersMock.mockResolvedValue([reminder({ id: 'r-due-now', schedule: '09:00' })]);

    await checkDueReminders('p1');

    expect(MockNotification.instances).toHaveLength(1);
    expect(MockNotification.instances[0].title).toContain('Blood pressure pill');
  });

  it('does not fire for a reminder scheduled later today', async () => {
    getTodaysRemindersMock.mockResolvedValue([reminder({ id: 'r-future', schedule: '09:30' })]);

    await checkDueReminders('p1');

    expect(MockNotification.instances).toHaveLength(0);
  });

  it('does not fire for a reminder whose due window has already passed', async () => {
    getTodaysRemindersMock.mockResolvedValue([reminder({ id: 'r-stale', schedule: '08:00' })]);

    await checkDueReminders('p1');

    expect(MockNotification.instances).toHaveLength(0);
  });

  it('does not fire for a reminder already marked taken today', async () => {
    getTodaysRemindersMock.mockResolvedValue([
      reminder({ id: 'r-taken', schedule: '09:00', takenToday: true }),
    ]);

    await checkDueReminders('p1');

    expect(MockNotification.instances).toHaveLength(0);
  });

  it('does not fire twice for the same reminder on repeated checks', async () => {
    getTodaysRemindersMock.mockResolvedValue([reminder({ id: 'r-dedup', schedule: '09:00' })]);

    await checkDueReminders('p1');
    await checkDueReminders('p1');

    expect(MockNotification.instances).toHaveLength(1);
  });

  it('never calls Notification when permission is not granted', async () => {
    MockNotification.permission = 'default';
    getTodaysRemindersMock.mockResolvedValue([reminder({ id: 'r-no-permission', schedule: '09:00' })]);

    await checkDueReminders('p1');

    expect(getTodaysRemindersMock).not.toHaveBeenCalled();
    expect(MockNotification.instances).toHaveLength(0);
  });
});
