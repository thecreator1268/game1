import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import type { GameId } from '@/db/types';
import { composeTodaysSet, type PlayHistoryEntry, type TodaysSet } from '@/engine/sessionComposer';

function startOfDay(date = new Date()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function useTodaysSet(patientId: string): TodaysSet | undefined {
  return useLiveQuery(async () => {
    const sessions = await db.sessions.where('patientId').equals(patientId).toArray();

    const lastPlayedMap = new Map<GameId, number>();
    for (const s of sessions) {
      const prev = lastPlayedMap.get(s.gameId) ?? Number.NEGATIVE_INFINITY;
      if (s.startedAt > prev) lastPlayedMap.set(s.gameId, s.startedAt);
    }
    const playHistory: PlayHistoryEntry[] = Array.from(lastPlayedMap.entries()).map(
      ([gameId, lastPlayedAt]) => ({ gameId, lastPlayedAt }),
    );

    const todayStart = startOfDay();
    const orientationCompletedToday = sessions.some(
      (s) => s.gameId === 'aaj-ka-din' && s.startedAt >= todayStart,
    );

    return composeTodaysSet(playHistory, { orientationCompletedToday });
  }, [patientId]);
}
