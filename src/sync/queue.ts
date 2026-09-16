import { db } from '@/db/schema';
import { isEffectivelyOnline, useSyncStore } from '@/store/syncStore';
import { mockSyncRequest } from './mockServer';

// All reads/writes go to Dexie first — nothing in this app blocks on
// network. This module is the only thing that ever talks to the network,
// and it runs opportunistically: on an interval, when the browser fires
// "online", and once immediately on startup.

async function withRetry<T>(fn: () => Promise<T>, retries = 3, baseDelayMs = 500): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      if (attempt > retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** (attempt - 1)));
    }
  }
}

export interface SyncResult {
  syncedSessions: number;
  syncedReminderLogs: number;
}

export async function syncPendingData(): Promise<SyncResult> {
  const store = useSyncStore.getState();
  if (!isEffectivelyOnline()) return { syncedSessions: 0, syncedReminderLogs: 0 };
  if (store.isSyncing) return { syncedSessions: 0, syncedReminderLogs: 0 };

  store.setSyncing(true);
  try {
    const [unsyncedSessions, unsyncedReminderLogs] = await Promise.all([
      db.sessions.filter((s) => !s.synced).toArray(),
      db.reminderLogs.filter((r) => !r.synced).toArray(),
    ]);

    if (unsyncedSessions.length === 0 && unsyncedReminderLogs.length === 0) {
      store.setLastSyncedAt(Date.now());
      return { syncedSessions: 0, syncedReminderLogs: 0 };
    }

    await withRetry(() =>
      mockSyncRequest({ sessions: unsyncedSessions, reminderLogs: unsyncedReminderLogs }),
    );

    await db.transaction('rw', db.sessions, db.reminderLogs, async () => {
      await Promise.all([
        ...unsyncedSessions.map((s) => db.sessions.update(s.id, { synced: true })),
        ...unsyncedReminderLogs.map((r) => db.reminderLogs.update(r.id, { synced: true })),
      ]);
    });

    store.setLastSyncedAt(Date.now());
    return {
      syncedSessions: unsyncedSessions.length,
      syncedReminderLogs: unsyncedReminderLogs.length,
    };
  } catch (err) {
    store.setLastSyncError(err instanceof Error ? err.message : 'Sync failed');
    return { syncedSessions: 0, syncedReminderLogs: 0 };
  } finally {
    store.setSyncing(false);
  }
}

export async function countPendingSync(): Promise<number> {
  const [sessions, reminderLogs] = await Promise.all([
    db.sessions.filter((s) => !s.synced).count(),
    db.reminderLogs.filter((r) => !r.synced).count(),
  ]);
  return sessions + reminderLogs;
}

const AUTO_SYNC_INTERVAL_MS = 30_000;

export function startAutoSync(): () => void {
  if (typeof window === 'undefined') return () => {};

  const trigger = () => {
    void syncPendingData();
  };

  window.addEventListener('online', trigger);
  const interval = window.setInterval(trigger, AUTO_SYNC_INTERVAL_MS);
  trigger();

  return () => {
    window.removeEventListener('online', trigger);
    window.clearInterval(interval);
  };
}
