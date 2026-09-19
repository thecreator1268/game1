import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import type { GameId } from '@/db/types';
import { composeTodaysSet, type PlayHistoryEntry } from '@/engine/sessionComposer';

export function useTodaysSet(patientId: string): GameId[] | undefined {
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

    return composeTodaysSet(playHistory);
  }, [patientId]);
}
