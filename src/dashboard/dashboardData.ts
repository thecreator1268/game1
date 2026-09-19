import { db } from '@/db/schema';
import type { Domain, GameSession, LevelChange, Reminder, ReminderLog } from '@/db/types';
import { DOMAINS } from '@/games/gameList';
import {
  computeDomainTrend,
  detectAnomalies,
  type AnomalyFlag,
  type DomainTrendResult,
  type TrendPoint,
} from '@/engine/trendAnalysis';

function dayKey(timestamp: number): string {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function lastNDayKeys(days: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

export type DomainTrendPoint = { date: string } & Partial<Record<Domain, number>>;

export async function getDomainTrends(patientId: string, days: number): Promise<DomainTrendPoint[]> {
  const sessions = await db.sessions.where('patientId').equals(patientId).toArray();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const recent = sessions.filter((s) => s.startedAt >= cutoff);

  const byDayDomain = new Map<string, Map<Domain, number[]>>();
  for (const s of recent) {
    const day = dayKey(s.startedAt);
    if (!byDayDomain.has(day)) byDayDomain.set(day, new Map());
    const domainMap = byDayDomain.get(day)!;
    if (!domainMap.has(s.domain)) domainMap.set(s.domain, []);
    domainMap.get(s.domain)!.push(s.accuracy * 100);
  }

  return lastNDayKeys(days).map((date) => {
    const point: DomainTrendPoint = { date };
    const domainMap = byDayDomain.get(date);
    if (domainMap) {
      for (const domain of DOMAINS) {
        const values = domainMap.get(domain);
        if (values && values.length > 0) {
          point[domain] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        }
      }
    }
    return point;
  });
}

export async function getDomainAveragesForRange(
  patientId: string,
  startDaysAgo: number,
  endDaysAgo: number,
): Promise<DomainTrendPoint> {
  const sessions = await db.sessions.where('patientId').equals(patientId).toArray();
  const now = Date.now();
  const start = now - startDaysAgo * 24 * 60 * 60 * 1000;
  const end = now - endDaysAgo * 24 * 60 * 60 * 1000;
  const inRange = sessions.filter((s) => s.startedAt >= start && s.startedAt < end);

  const byDomain = new Map<Domain, number[]>();
  for (const s of inRange) {
    if (!byDomain.has(s.domain)) byDomain.set(s.domain, []);
    byDomain.get(s.domain)!.push(s.accuracy * 100);
  }

  const point: DomainTrendPoint = { date: 'range' };
  for (const domain of DOMAINS) {
    const values = byDomain.get(domain);
    if (values && values.length > 0) {
      point[domain] = values.reduce((a, b) => a + b, 0) / values.length;
    }
  }
  return point;
}

export interface DomainBalanceEntry {
  domain: Domain;
  sessionCount: number;
}

export async function getDomainBalance(patientId: string, days: number): Promise<DomainBalanceEntry[]> {
  const sessions = await db.sessions.where('patientId').equals(patientId).toArray();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const recent = sessions.filter((s) => s.startedAt >= cutoff);
  const counts = new Map<Domain, number>();
  for (const domain of DOMAINS) counts.set(domain, 0);
  for (const s of recent) counts.set(s.domain, (counts.get(s.domain) ?? 0) + 1);
  return DOMAINS.map((domain) => ({ domain, sessionCount: counts.get(domain) ?? 0 }));
}

export interface DomainInsight {
  domain: Domain;
  trend: DomainTrendResult;
  anomalies: AnomalyFlag[];
}

// The "AI/ML" analytics layer the problem statement asks for, surfaced
// per-domain: a real linear-regression trend (not a two-point comparison)
// plus outlier detection against the patient's own baseline. See
// engine/trendAnalysis.ts for the method and why it's deliberately simple
// and explainable rather than a black box.
export async function getCognitiveInsights(patientId: string): Promise<DomainInsight[]> {
  const sessions = await db.sessions.where('patientId').equals(patientId).toArray();
  const byDomain = new Map<Domain, TrendPoint[]>();
  for (const domain of DOMAINS) byDomain.set(domain, []);
  for (const s of sessions) {
    byDomain.get(s.domain)?.push({ timestamp: s.startedAt, accuracy: s.accuracy });
  }

  return DOMAINS.map((domain) => {
    const points = byDomain.get(domain) ?? [];
    return {
      domain,
      trend: computeDomainTrend(points),
      anomalies: detectAnomalies(points).slice(-3),
    };
  });
}

export async function getAdaptiveLog(patientId: string, limit = 50): Promise<LevelChange[]> {
  const changes = await db.levelChanges.where('patientId').equals(patientId).toArray();
  return changes.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

export interface AdherenceDay {
  date: string;
  taken: number;
  expected: number;
}

async function getActiveDailyReminders(patientId: string): Promise<Reminder[]> {
  const reminders = await db.reminders.where('patientId').equals(patientId).toArray();
  return reminders.filter((r) => r.active && r.category !== 'appointment');
}

export async function getAdherence(
  patientId: string,
  days: number,
): Promise<{ series: AdherenceDay[]; streak: number }> {
  const dailyReminders = await getActiveDailyReminders(patientId);
  const logs = await db.reminderLogs.where('patientId').equals(patientId).toArray();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const recentLogs = logs.filter((l) => l.acknowledgedAt >= cutoff);

  const byDay = new Map<string, Set<string>>();
  for (const l of recentLogs) {
    const day = dayKey(l.acknowledgedAt);
    if (!byDay.has(day)) byDay.set(day, new Set());
    byDay.get(day)!.add(l.reminderId);
  }

  // A reminder can only be "expected" on days on/after it was created —
  // counting today's reminder set against last week's empty days made a
  // brand-new patient read "missed on 7 days".
  const series = lastNDayKeys(days).map((date) => ({
    date,
    taken: byDay.get(date)?.size ?? 0,
    expected: dailyReminders.filter((r) => dayKey(r.createdAt) <= date).length,
  }));

  let streak = 0;
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i].expected > 0 && series[i].taken >= series[i].expected) streak += 1;
    else break;
  }

  return { series, streak };
}

export interface WeeklySummaryInput {
  trendsThisWeek: DomainTrendPoint[];
  trendsLastWeek: DomainTrendPoint[];
  adherenceThisWeek: AdherenceDay[];
}

function averageDomain(points: DomainTrendPoint[], domain: Domain): number | null {
  const values = points.map((p) => p[domain]).filter((v): v is number => typeof v === 'number');
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Template-based (not an LLM call) so it works fully offline, per the
// project's offline-first constraint.
export function buildWeeklySummary(input: WeeklySummaryInput): string {
  const { trendsThisWeek, trendsLastWeek, adherenceThisWeek } = input;
  const parts: string[] = [];

  let bestDomain: Domain | null = null;
  let bestDelta = 0;
  let worstDomain: Domain | null = null;
  let worstDelta = 0;

  for (const domain of DOMAINS) {
    const thisWeek = averageDomain(trendsThisWeek, domain);
    const lastWeek = averageDomain(trendsLastWeek, domain);
    if (thisWeek === null || lastWeek === null) continue;
    const delta = thisWeek - lastWeek;
    if (delta > bestDelta) {
      bestDelta = delta;
      bestDomain = domain;
    }
    if (delta < worstDelta) {
      worstDelta = delta;
      worstDomain = domain;
    }
  }

  if (bestDomain) {
    parts.push(`${bestDomain} scores improved this week (+${Math.round(bestDelta)}%).`);
  }
  if (worstDomain && worstDomain !== bestDomain) {
    parts.push(`${worstDomain} scores dipped a little (${Math.round(worstDelta)}%) — worth a gentle nudge.`);
  }

  // Today is still in progress, so an unfinished set isn't a "missed" day yet.
  const today = dayKey(Date.now());
  const closedDays = adherenceThisWeek.filter((d) => d.date !== today);
  const missedDays = closedDays.filter((d) => d.expected > 0 && d.taken < d.expected).length;
  if (closedDays.some((d) => d.expected > 0)) {
    parts.push(
      missedDays === 0
        ? 'All reminders were acknowledged every day this week.'
        : `Reminders were missed on ${missedDays} day${missedDays === 1 ? '' : 's'} this week.`,
    );
  }

  if (parts.length === 0) {
    return 'Not enough data yet this week — play a few games and log a few reminders to see a summary here.';
  }
  return parts.join(' ');
}

export function toCsv(sessions: GameSession[], reminderLogs: ReminderLog[]): string {
  const sessionRows = sessions.map((s) =>
    [
      'session',
      s.gameId,
      s.domain,
      s.level,
      s.score,
      Math.round(s.accuracy * 100),
      Math.round(s.avgResponseMs),
      new Date(s.startedAt).toISOString(),
    ].join(','),
  );
  const reminderRows = reminderLogs.map((r) =>
    ['reminder', r.reminderId, '', '', '', '', '', new Date(r.acknowledgedAt).toISOString()].join(','),
  );
  const header = 'type,gameOrReminderId,domain,level,score,accuracyPct,avgResponseMs,timestamp';
  return [header, ...sessionRows, ...reminderRows].join('\n');
}
