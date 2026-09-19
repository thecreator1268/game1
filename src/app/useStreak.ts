import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { computePlayStreak } from '@/engine/streak';

export function useStreak(patientId: string): number | undefined {
  return useLiveQuery(async () => {
    const sessions = await db.sessions.where('patientId').equals(patientId).toArray();
    return computePlayStreak(sessions.map((s) => s.startedAt));
  }, [patientId]);
}
