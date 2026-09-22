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

/** A domain's estimate is at least this many percentage points below the average of the rest. */
export const ASYMMETRY_GAP_THRESHOLD = 0.25;
/** The gap must hold up when re-checked this far in the past, not just today. */
export const ASYMMETRY_SUSTAINED_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks

export interface AsymmetricDomainFlag {
  domain: Domain;
  /** How far below the other domains' average, as whole percentage points (>= 25). */
  gapPct: number;
  /** How many whole weeks the gap has held, re-checked backward; always >= 2. */
  weeks: number;
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

/**
 * A wellness observation, not a score: is one domain lagging the patient's
 * other domains by a lot, consistently, rather than from one bad session?
 *
 * `asOf` estimates the mastery of every domain using only sessions up to that
 * moment (the stored current row is used only for `now`, as an exact match for
 * what the dashboard already shows; every earlier check-point is a full
 * replay). A domain qualifies only when ALL FIVE domains already have at
 * least one session by that check-point — this is the existing "not enough
 * data yet" gate applied to the whole comparison, not just the lagging
 * domain, because "25 points below the average of the other four" is not a
 * meaningful comparison if some of those four have no data yet.
 */
function domainGapAt(
  domains: readonly Domain[],
  sessions: GameSession[],
  stored: Map<Domain, number>,
  asOf: number,
  now: number,
): { domain: Domain; gap: number } | null {
  const estimates = domains.map((domain) => {
    const accuracies = domainSessionAccuracies(
      sessions.filter((s) => s.startedAt <= asOf),
      domain,
    );
    if (accuracies.length === 0) return { domain, pL: null as number | null };
    const pL = asOf === now ? (stored.get(domain) ?? replayMastery(accuracies)) : replayMastery(accuracies);
    return { domain, pL };
  });
  if (estimates.some((e) => e.pL === null)) return null;

  let worst: { domain: Domain; gap: number } | null = null;
  for (const { domain, pL } of estimates) {
    const others = estimates.filter((e) => e.domain !== domain).map((e) => e.pL as number);
    const avgOthers = others.reduce((a, b) => a + b, 0) / others.length;
    const gap = avgOthers - (pL as number);
    if (gap >= ASYMMETRY_GAP_THRESHOLD && (!worst || gap > worst.gap)) {
      worst = { domain, gap };
    }
  }
  return worst;
}

/**
 * At most one flagged domain (the most asymmetric one), or null. See
 * domainGapAt for the gate and the comparison; "sustained" is checked by
 * re-running the same comparison as of 2 weeks ago using only the sessions
 * that existed then, and requiring the SAME domain to be flagged both times —
 * a domain with only one recent low session has no data 2 weeks back, so it
 * fails this check rather than flagging on a single session.
 */
export async function getAsymmetricDomainFlag(
  patientId: string,
  now = Date.now(),
): Promise<AsymmetricDomainFlag | null> {
  const [sessions, rows] = await Promise.all([
    db.sessions.where('patientId').equals(patientId).toArray(),
    db.masteryEstimates.where('patientId').equals(patientId).toArray(),
  ]);
  const stored = new Map(rows.map((r) => [r.domain, r.pL]));

  const current = domainGapAt(DOMAINS, sessions, stored, now, now);
  if (!current) return null;

  const twoWeeksAgo = domainGapAt(DOMAINS, sessions, stored, now - ASYMMETRY_SUSTAINED_MS, now);
  if (!twoWeeksAgo || twoWeeksAgo.domain !== current.domain) return null;

  // Widen backward in whole weeks while the same domain keeps qualifying, so
  // the caregiver-facing copy can say how long, not just "at least 2 weeks".
  let weeks = 2;
  const maxWeeksChecked = 26; // half a year is plenty for a wellness note, not a hard cap on reality
  while (weeks < maxWeeksChecked) {
    const asOf = now - (weeks + 1) * 7 * 24 * 60 * 60 * 1000;
    const check = domainGapAt(DOMAINS, sessions, stored, asOf, now);
    if (!check || check.domain !== current.domain) break;
    weeks += 1;
  }

  return { domain: current.domain, gapPct: Math.round(current.gap * 100), weeks };
}
