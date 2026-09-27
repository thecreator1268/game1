import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import type { GameId } from '@/db/types';
import { composeTodaysSet, type PlayHistoryEntry } from '@/engine/sessionComposer';

// Local calendar day (not UTC) — matches the existing "was this due today"
// key pattern in reminders/notificationService.ts.
function localDateKey(date = new Date()): string {
  return date.toDateString();
}

interface TodaysSetResult {
  gameIds: GameId[];
  // True when this render's gameIds were freshly computed and still need
  // persisting — real IndexedDB (unlike fake-indexeddb, which is what the
  // unit tests run against) throws ReadOnlyError on a write attempted from
  // inside a liveQuery querier, so the write has to happen from a plain
  // effect afterwards, never inside the query function below.
  today: string;
  needsPersist: boolean;
}

// Today's Set is pinned to the local calendar day it was chosen (stored on
// the Patient record) so it doesn't reshuffle mid-day: composeTodaysSet is
// purely derived from each game's last-played timestamp, so without pinning,
// every session played today would shift the staleness ranking and change
// the set on the very next render. Only recomputed once the stored date is
// no longer today.
export function useTodaysSet(patientId: string): GameId[] | undefined {
  const result = useLiveQuery<TodaysSetResult | undefined>(async () => {
    if (!patientId) return undefined;
    const patient = await db.patients.get(patientId);
    if (!patient) return undefined;

    const today = localDateKey();
    if (patient.todaysSet?.date === today) {
      return { gameIds: patient.todaysSet.gameIds, today, needsPersist: false };
    }

    const sessions = await db.sessions.where('patientId').equals(patientId).toArray();

    const lastPlayedMap = new Map<GameId, number>();
    for (const s of sessions) {
      const prev = lastPlayedMap.get(s.gameId) ?? Number.NEGATIVE_INFINITY;
      if (s.startedAt > prev) lastPlayedMap.set(s.gameId, s.startedAt);
    }
    const playHistory: PlayHistoryEntry[] = Array.from(lastPlayedMap.entries()).map(
      ([gameId, lastPlayedAt]) => ({ gameId, lastPlayedAt }),
    );

    return { gameIds: composeTodaysSet(playHistory), today, needsPersist: true };
  }, [patientId]);

  useEffect(() => {
    if (result?.needsPersist) {
      void db.patients.update(patientId, { todaysSet: { date: result.today, gameIds: result.gameIds } });
    }
  }, [patientId, result]);

  return result?.gameIds;
}
