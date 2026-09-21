import { db } from '@/db/schema';
import type { ErrorType, GameId, GameSession } from '@/db/types';
import { newId } from '@/lib/id';
import { syncPendingData } from '@/sync/queue';
import { getGameMeta } from '@/games/gameList';
import { decideNextLevel, WINDOW_SIZE, type AttemptResult, type LevelDecision } from './adaptiveEngine';
import { updateDomainMastery } from './masteryService';

export async function getCurrentLevel(patientId: string, gameId: GameId): Promise<number> {
  const allChanges = await db.levelChanges.where('patientId').equals(patientId).toArray();
  const gameChanges = allChanges
    .filter((c) => c.gameId === gameId)
    .sort((a, b) => b.timestamp - a.timestamp);
  if (gameChanges.length > 0) return gameChanges[0].toLevel;

  const allSessions = await db.sessions.where('patientId').equals(patientId).toArray();
  const gameSessions = allSessions
    .filter((s) => s.gameId === gameId)
    .sort((a, b) => b.startedAt - a.startedAt);
  if (gameSessions.length > 0) return gameSessions[0].level;

  return 1;
}

async function getRecentAttemptsAtLevel(
  patientId: string,
  gameId: GameId,
  level: number,
  limit = WINDOW_SIZE,
): Promise<AttemptResult[]> {
  const allSessions = await db.sessions.where('patientId').equals(patientId).toArray();
  const relevant = allSessions
    .filter((s) => s.gameId === gameId && s.level === level)
    .sort((a, b) => a.startedAt - b.startedAt);
  return relevant.slice(-limit).map((s) => ({
    accuracy: s.accuracy,
    avgResponseMs: s.avgResponseMs,
    timestamp: s.startedAt,
  }));
}

export interface RecordSessionInput {
  patientId: string;
  gameId: GameId;
  level: number;
  score: number;
  accuracy: number;
  avgResponseMs: number;
  errorTypes: ErrorType[];
  startedAt: number;
  endedAt: number;
}

export interface RecordSessionResult {
  session: GameSession;
  levelDecision: LevelDecision | null;
}

/**
 * Persists a finished game session and, for games that use the adaptive
 * engine, immediately evaluates whether the next attempt should be a
 * different level — logging the reason so it's auditable from the
 * caregiver dashboard's adaptive engine log.
 */
export async function recordGameSession(input: RecordSessionInput): Promise<RecordSessionResult> {
  const meta = getGameMeta(input.gameId);

  const session: GameSession = {
    id: newId(),
    patientId: input.patientId,
    gameId: input.gameId,
    domain: meta.domain,
    level: input.level,
    score: input.score,
    accuracy: input.accuracy,
    avgResponseMs: input.avgResponseMs,
    errorTypes: input.errorTypes,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    synced: false,
  };
  await db.sessions.add(session);

  // Every session is evidence about the domain, including games that don't
  // adapt their own level, so the mastery estimate is updated for all of them.
  const mastery = await updateDomainMastery(input.patientId, meta.domain, session);

  let levelDecision: LevelDecision | null = null;
  if (meta.usesAdaptiveEngine) {
    const history = await getRecentAttemptsAtLevel(input.patientId, input.gameId, input.level);
    levelDecision = decideNextLevel(input.level, history, mastery.pL);
    if (levelDecision.changed) {
      await db.levelChanges.add({
        id: newId(),
        patientId: input.patientId,
        gameId: input.gameId,
        fromLevel: input.level,
        toLevel: levelDecision.newLevel,
        reason: levelDecision.reason,
        timestamp: Date.now(),
      });
    }
  }

  void syncPendingData();

  return { session, levelDecision };
}
