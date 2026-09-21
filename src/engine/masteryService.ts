import { db } from '@/db/schema';
import type { Domain, GameSession, MasteryEstimate } from '@/db/types';
import { DOMAINS } from '@/games/gameList';
import { replayMastery, updateMasteryFromAccuracy } from './bkt';

function domainSessionAccuracies(sessions: GameSession[], domain: Domain): number[] {
  return sessions
    .filter((s) => s.domain === domain)
    .sort((a, b) => a.startedAt - b.startedAt)
    .map((s) => s.accuracy);
}

/** The bits of a just-recorded session the estimate needs. */
export type MasterySession = Pick<GameSession, 'id' | 'accuracy' | 'startedAt'>;

/**
 * Fold one finished session into the patient's mastery estimate for its domain
 * and persist it. Call after the session row has been written.
 *
 * If there is no stored estimate yet (a new patient, or one whose history
 * predates this table) the estimate is rebuilt by replaying the domain's
 * sessions that came BEFORE this one, oldest first, and then applying this
 * session — so it always equals a from-scratch replay, and a session is never
 * counted twice even if several were written before the first update ran.
 * Otherwise it is updated incrementally from the stored value.
 *
 * Runs in one transaction so two quick sessions cannot overwrite each other.
 */
export async function updateDomainMastery(
  patientId: string,
  domain: Domain,
  session: MasterySession,
): Promise<MasteryEstimate> {
  return db.transaction('rw', db.masteryEstimates, db.sessions, async () => {
    const existing = await db.masteryEstimates.get([patientId, domain]);
    let before: number;
    if (existing) {
      before = existing.pL;
    } else {
      const sessions = await db.sessions.where('patientId').equals(patientId).toArray();
      const older = sessions.filter((s) => s.id !== session.id && s.startedAt <= session.startedAt);
      before = replayMastery(domainSessionAccuracies(older, domain));
    }
    const row: MasteryEstimate = {
      patientId,
      domain,
      pL: updateMasteryFromAccuracy(before, session.accuracy),
      updatedAt: Date.now(),
    };
    await db.masteryEstimates.put(row);
    return row;
  });
}

export interface DomainMastery {
  domain: Domain;
  /** Probability of mastery, 0-1; null when the patient has no attempts in this domain. */
  pL: number | null;
}

/**
 * Current mastery per domain for the caregiver dashboard. Read-only (safe inside
 * a live query): uses the stored estimate, or replays sessions for a domain that
 * has history but no stored row yet. A domain with no attempts is null — the
 * prior alone is not evidence, so it is never shown as a percentage.
 */
export async function getDomainMastery(patientId: string): Promise<DomainMastery[]> {
  const [rows, sessions] = await Promise.all([
    db.masteryEstimates.where('patientId').equals(patientId).toArray(),
    db.sessions.where('patientId').equals(patientId).toArray(),
  ]);
  const stored = new Map(rows.map((r) => [r.domain, r.pL]));

  return DOMAINS.map((domain) => {
    const accuracies = domainSessionAccuracies(sessions, domain);
    if (accuracies.length === 0) return { domain, pL: null };
    return { domain, pL: stored.get(domain) ?? replayMastery(accuracies) };
  });
}
