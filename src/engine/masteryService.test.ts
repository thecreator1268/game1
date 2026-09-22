// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db/schema';
import type { Domain, GameSession } from '@/db/types';
import { getDomainBalance } from '@/dashboard/dashboardData';
import { deletePatientData } from '@/lib/patientDeletion';
import { DEFAULT_BKT_PARAMS, replayMastery, updateMasteryFromAccuracy } from './bkt';
import { recordGameSession } from './gameSessionService';
import { getAsymmetricDomainFlag, getDomainMastery, updateDomainMastery } from './masteryService';

vi.mock('@/sync/queue', () => ({ syncPendingData: vi.fn() }));

// Recent timestamps, so sessions fall inside the dashboard's "last 30 days" range.
let clock = Date.now() - 5 * 24 * 60 * 60 * 1000;
function session(patientId: string, domain: Domain, accuracy: number): GameSession {
  clock += 60_000;
  return {
    id: `s-${clock}-${Math.random()}`,
    patientId,
    gameId: 'smriti-cards',
    domain,
    level: 1,
    score: 0,
    accuracy,
    avgResponseMs: 2000,
    errorTypes: ['none'],
    startedAt: clock,
    endedAt: clock + 30_000,
    synced: false,
  };
}

// For the asymmetric-domain flag: sessions at an explicit point in the past,
// rather than the `session()` helper's "a few minutes ago" clock.
function sessionAt(patientId: string, domain: Domain, accuracy: number, daysAgo: number): GameSession {
  const startedAt = Date.now() - daysAgo * 24 * 60 * 60 * 1000;
  return {
    id: `s-${startedAt}-${domain}-${Math.random()}`,
    patientId,
    gameId: 'smriti-cards',
    domain,
    level: 1,
    score: 0,
    accuracy,
    avgResponseMs: 2000,
    errorTypes: ['none'],
    startedAt,
    endedAt: startedAt + 30_000,
    synced: false,
  };
}

beforeEach(async () => {
  await Promise.all(db.tables.map((table) => table.clear()));
});

describe('updateDomainMastery', () => {
  it('a brand-new patient starts from the prior and takes the first session as one update', async () => {
    const first = session('p1', 'memory', 1);
    await db.sessions.add(first);
    const row = await updateDomainMastery('p1', 'memory', first);

    expect(row.pL).toBeCloseTo(updateMasteryFromAccuracy(DEFAULT_BKT_PARAMS.pL0, 1), 12);
    expect(await db.masteryEstimates.get(['p1', 'memory'])).toMatchObject({ patientId: 'p1', domain: 'memory' });
  });

  it('bootstraps an existing patient (history but no stored row) by replaying every session in the domain', async () => {
    const history = [0.9, 0.4, 1, 0.7, 0.8].map((a) => session('p1', 'attention', a));
    await db.sessions.bulkAdd(history);
    // Another domain's sessions must not leak in.
    await db.sessions.add(session('p1', 'memory', 0));
    const latest = session('p1', 'attention', 0.6);
    await db.sessions.add(latest);

    const row = await updateDomainMastery('p1', 'attention', latest);
    // the latest session is counted exactly once: older sessions replayed, then it applied
    expect(row.pL).toBeCloseTo(replayMastery([0.9, 0.4, 1, 0.7, 0.8, 0.6]), 12);
  });

  it('once a row exists it updates incrementally, and matches a from-scratch replay', async () => {
    const accuracies = [0.5, 1, 0.3, 0.9];
    let last = 0;
    for (const a of accuracies) {
      const s = session('p1', 'routine', a);
      await db.sessions.add(s);
      last = (await updateDomainMastery('p1', 'routine', s)).pL;
    }
    expect(last).toBeCloseTo(replayMastery(accuracies), 12);
    expect(await db.masteryEstimates.where('patientId').equals('p1').count()).toBe(1); // one row per domain
  });

  it('keeps patients and domains separate', async () => {
    const sa = session('p1', 'memory', 1);
    const sb = session('p2', 'memory', 0);
    const sc = session('p1', 'pattern', 0);
    await db.sessions.bulkAdd([sa, sb, sc]);
    const a = await updateDomainMastery('p1', 'memory', sa);
    const b = await updateDomainMastery('p2', 'memory', sb);
    const c = await updateDomainMastery('p1', 'pattern', sc);

    expect(a.pL).toBeGreaterThan(0.6);
    expect(b.pL).toBeLessThan(0.2);
    expect(c.pL).toBeLessThan(0.2);
    expect(await db.masteryEstimates.count()).toBe(3);
  });

  it('two sessions written before either update ran are each counted exactly once', async () => {
    const one = session('p1', 'memory', 1);
    const two = session('p1', 'memory', 0.5);
    await db.sessions.bulkAdd([one, two]);
    await Promise.all([updateDomainMastery('p1', 'memory', one), updateDomainMastery('p1', 'memory', two)]);
    // exactly the from-scratch replay: not one session more (double count) or fewer (lost update)
    expect((await db.masteryEstimates.get(['p1', 'memory']))!.pL).toBeCloseTo(replayMastery([1, 0.5]), 12);
  });
});

describe('getDomainMastery', () => {
  it('is null for a domain with no attempts (the prior alone is not evidence)', async () => {
    await db.sessions.add(session('p1', 'memory', 1));
    const result = await getDomainMastery('p1');
    expect(result.find((m) => m.domain === 'orientation')?.pL).toBeNull();
    expect(result.find((m) => m.domain === 'memory')?.pL).not.toBeNull();
  });

  it('replays sessions for a domain that has history but no stored row', async () => {
    await db.sessions.bulkAdd([session('p1', 'pattern', 0.9), session('p1', 'pattern', 0.8)]);
    const pL = (await getDomainMastery('p1')).find((m) => m.domain === 'pattern')!.pL;
    expect(pL).toBeCloseTo(replayMastery([0.9, 0.8]), 12);
  });

  it('prefers the stored estimate when there is one', async () => {
    await db.sessions.add(session('p1', 'routine', 1));
    await db.masteryEstimates.put({ patientId: 'p1', domain: 'routine', pL: 0.5, updatedAt: 1 });
    expect((await getDomainMastery('p1')).find((m) => m.domain === 'routine')!.pL).toBe(0.5);
  });
});

describe('recordGameSession feeds the engine from the mastery estimate', () => {
  async function play(accuracy: number, avgResponseMs: number, level = 1) {
    clock += 60_000;
    return recordGameSession({
      patientId: 'p1',
      gameId: 'smriti-cards',
      level,
      score: 10,
      accuracy,
      avgResponseMs,
      errorTypes: ['none'],
      startedAt: clock,
      endedAt: clock + 30_000,
    });
  }

  it('gathers data for 4 sessions, then levels up on the 5th with a mastery-based log line', async () => {
    const times = [5000, 4500, 4000, 3000, 2500];
    let last;
    for (let i = 0; i < 5; i++) {
      last = await play(1, times[i]);
      if (i < 4) expect(last.levelDecision?.direction).toBe('hold');
    }
    expect(last?.levelDecision?.direction).toBe('up');
    expect(last?.levelDecision?.reason).toMatch(
      /^leveled up: domain mastery estimate \d\.\d\d \(at least 0\.80\) and this game's own last 5 sessions averaged 100% \(at least 80%\); avg/,
    );

    const change = await db.levelChanges.toArray();
    expect(change).toHaveLength(1);
    expect(change[0].reason).toContain('mastery estimate');

    const stored = (await db.masteryEstimates.get(['p1', 'memory']))!.pL;
    expect(stored).toBeCloseTo(replayMastery([1, 1, 1, 1, 1]), 12);
  });

  it('a steady patient at ~60% is held, not promoted or demoted, across many sessions', async () => {
    let last;
    for (let i = 0; i < 8; i++) last = await play(0.6, 3000);
    expect(last?.levelDecision?.direction).toBe('hold');
    expect(await db.levelChanges.count()).toBe(0);
  });

  it('a struggling patient is levelled down with a mastery-based reason', async () => {
    let last;
    // Level 3, not 1: level 1 is the floor, so it could never move down.
    for (let i = 0; i < 5; i++) last = await play(0.2, 5000, 3);
    // (the rising-error rule needs a strictly rising trend, so this is the estimate's doing)
    expect(last?.levelDecision?.direction).toBe('down');
    expect(last?.levelDecision?.reason).toMatch(
      /^leveled down: domain mastery estimate 0\.\d\d \(below 0\.40\); this game's last 5 sessions:/,
    );
  });

  it('non-adaptive games still update the domain estimate', async () => {
    clock += 60_000;
    await recordGameSession({
      patientId: 'p1',
      gameId: 'aaj-ka-din',
      level: 1,
      score: 3,
      accuracy: 1,
      avgResponseMs: 2000,
      errorTypes: ['none'],
      startedAt: clock,
      endedAt: clock + 10_000,
    });
    expect(await db.masteryEstimates.get(['p1', 'orientation'])).toBeDefined();
  });
});

describe('caregiver-facing numbers and data deletion', () => {
  it('getDomainBalance carries the mastery percent (whole number, all-time) alongside the session count', async () => {
    await db.sessions.bulkAdd([session('p1', 'memory', 1), session('p1', 'memory', 1)]);
    const balance = await getDomainBalance('p1', 30);

    const memory = balance.find((b) => b.domain === 'memory')!;
    expect(memory.sessionCount).toBe(2);
    expect(memory.masteryPct).toBe(Math.round(replayMastery([1, 1]) * 100));
    expect(balance.find((b) => b.domain === 'pattern')!.masteryPct).toBeNull();
  });

  it("deleting a patient's data removes their mastery rows and leaves others alone", async () => {
    await db.patients.bulkAdd([
      { id: 'p1', name: 'A' },
      { id: 'p2', name: 'B' },
    ] as never);
    await db.masteryEstimates.bulkPut([
      { patientId: 'p1', domain: 'memory', pL: 0.7, updatedAt: 1 },
      { patientId: 'p2', domain: 'memory', pL: 0.4, updatedAt: 1 },
    ]);

    await deletePatientData('p1');

    expect(await db.masteryEstimates.get(['p1', 'memory'])).toBeUndefined();
    expect(await db.masteryEstimates.get(['p2', 'memory'])).toBeDefined();
  });
});

describe('getAsymmetricDomainFlag', () => {
  // Four solid domains, spread over 5 weeks so "sustained" checks find data at
  // every checkpoint, high and steady accuracy.
  async function addSolidDomains(patientId: string, domains: Domain[]) {
    const rows: GameSession[] = [];
    for (const domain of domains) {
      for (const daysAgo of [35, 28, 21, 14, 7, 1]) {
        rows.push(sessionAt(patientId, domain, 0.95, daysAgo));
      }
    }
    await db.sessions.bulkAdd(rows);
  }

  it('does not fire on a single low session, even though the gap alone would clear 25 points', async () => {
    await addSolidDomains('p1', ['memory', 'attention', 'routine', 'orientation']);
    // pattern has exactly one session, very recent: a bad day, not a pattern.
    await db.sessions.add(sessionAt('p1', 'pattern', 0.1, 1));

    expect(await getAsymmetricDomainFlag('p1')).toBeNull();
  });

  it('fires when the same domain lags by 25+ points both now and 2 weeks ago', async () => {
    await addSolidDomains('p1', ['memory', 'attention', 'routine', 'orientation']);
    // pattern has its own history spanning the same 5 weeks, consistently weak.
    for (const daysAgo of [35, 28, 21, 14, 7, 1]) {
      await db.sessions.add(sessionAt('p1', 'pattern', 0.2, daysAgo));
    }

    const flag = await getAsymmetricDomainFlag('p1');
    expect(flag).not.toBeNull();
    expect(flag!.domain).toBe('pattern');
    expect(flag!.gapPct).toBeGreaterThanOrEqual(25);
    expect(flag!.weeks).toBeGreaterThanOrEqual(2);
  });

  it('does not fire when the gap is real today but was not there 2 weeks ago (a recent dip, not sustained)', async () => {
    await addSolidDomains('p1', ['memory', 'attention', 'routine', 'orientation']);
    // pattern matched the others until 10 days ago, then dropped off sharply.
    for (const daysAgo of [35, 28, 21]) await db.sessions.add(sessionAt('p1', 'pattern', 0.95, daysAgo));
    for (const daysAgo of [10, 7, 1]) await db.sessions.add(sessionAt('p1', 'pattern', 0.1, daysAgo));

    expect(await getAsymmetricDomainFlag('p1')).toBeNull();
  });

  it('requires every domain to have data before comparing (the existing "not enough data yet" gate)', async () => {
    // Only 3 of the other 4 domains have any sessions; orientation has none.
    await addSolidDomains('p1', ['memory', 'attention', 'routine']);
    for (const daysAgo of [35, 28, 21, 14, 7, 1]) {
      await db.sessions.add(sessionAt('p1', 'pattern', 0.2, daysAgo));
    }

    expect(await getAsymmetricDomainFlag('p1')).toBeNull();
  });

  it('flags at most one domain: the most asymmetric of several lagging ones', async () => {
    await addSolidDomains('p1', ['memory', 'attention']);
    for (const daysAgo of [35, 28, 21, 14, 7, 1]) {
      await db.sessions.add(sessionAt('p1', 'routine', 0.5, daysAgo)); // lags a little
      await db.sessions.add(sessionAt('p1', 'pattern', 0.05, daysAgo)); // lags a lot
      await db.sessions.add(sessionAt('p1', 'orientation', 0.95, daysAgo));
    }

    const flag = await getAsymmetricDomainFlag('p1');
    expect(flag).not.toBeNull();
    expect(flag!.domain).toBe('pattern');
  });

  it('is null when no domain lags by 25+ points', async () => {
    await addSolidDomains('p1', ['memory', 'attention', 'routine', 'orientation', 'pattern']);
    expect(await getAsymmetricDomainFlag('p1')).toBeNull();
  });
});
