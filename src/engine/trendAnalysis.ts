// On-device cognitive analytics: a real statistical-learning layer, not a
// rule-of-thumb. Two classical, well-established techniques —
//   1. ordinary least-squares linear regression, to estimate whether a
//      domain is genuinely trending up/down over time (not just "today vs
//      yesterday"), with R² surfaced so a low-confidence trend never reads
//      as a confident one;
//   2. rolling z-score anomaly detection, to flag a session that's a real
//      outlier against the *patient's own* recent baseline, not a
//      population norm.
// Both run instantly on a few dozen data points with no training phase, no
// external dataset, and no network call — the same "explainable, on-device,
// zero training data" constraint as adaptiveEngine.ts, applied to
// caregiver-facing analytics instead of in-game difficulty. See
// dashboard/dashboardData.ts (getCognitiveInsights) for how session history
// is fed into this module, and dashboard/CognitiveInsights.tsx for the UI.

export interface TrendPoint {
  timestamp: number;
  accuracy: number; // 0-1
}

export type TrendDirection = 'improving' | 'stable' | 'declining' | 'insufficient-data';

export interface DomainTrendResult {
  direction: TrendDirection;
  slopePerWeek: number; // accuracy percentage-points change per 7 days
  confidencePct: number; // 0-100, the R² of the linear fit
  reason: string;
}

export const MIN_POINTS_FOR_TREND = 5;
export const STABLE_SLOPE_THRESHOLD = 1.5; // percentage points per week

export function computeDomainTrend(points: TrendPoint[]): DomainTrendResult {
  if (points.length < MIN_POINTS_FOR_TREND) {
    return {
      direction: 'insufficient-data',
      slopePerWeek: 0,
      confidencePct: 0,
      reason: `gathering data (${points.length}/${MIN_POINTS_FOR_TREND} sessions needed for a trend)`,
    };
  }

  const sorted = [...points].sort((a, b) => a.timestamp - b.timestamp);
  const t0 = sorted[0].timestamp;
  const xs = sorted.map((p) => (p.timestamp - t0) / (1000 * 60 * 60 * 24)); // days since first session
  const ys = sorted.map((p) => p.accuracy * 100);
  const n = xs.length;

  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denom = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    denom += (xs[i] - meanX) ** 2;
  }
  const slopePerDay = denom === 0 ? 0 : num / denom;
  const intercept = meanY - slopePerDay * meanX;

  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const predicted = intercept + slopePerDay * xs[i];
    ssRes += (ys[i] - predicted) ** 2;
    ssTot += (ys[i] - meanY) ** 2;
  }
  const rSquared = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);
  const slopePerWeek = slopePerDay * 7;
  const confidencePct = Math.round(rSquared * 100);

  let direction: TrendDirection;
  if (Math.abs(slopePerWeek) < STABLE_SLOPE_THRESHOLD) {
    direction = 'stable';
  } else if (slopePerWeek > 0) {
    direction = 'improving';
  } else {
    direction = 'declining';
  }

  const magnitude = Math.abs(slopePerWeek).toFixed(1);
  const reason =
    direction === 'stable'
      ? `holding steady (±${magnitude} pts/week, R²=${confidencePct}%, ${n} sessions)`
      : `${direction} by ${magnitude} accuracy points/week (R²=${confidencePct}%, ${n} sessions)`;

  return { direction, slopePerWeek, confidencePct, reason };
}

export interface AnomalyFlag {
  timestamp: number;
  accuracy: number;
  zScore: number;
  reason: string;
}

export const ANOMALY_WINDOW = 10;
export const ANOMALY_Z_THRESHOLD = 2;
const MIN_BASELINE_SIZE = 4;
const MIN_MEANINGFUL_STD = 1; // percentage points

/**
 * Flags sessions whose accuracy is a statistical outlier (|z| >= 2) against
 * the rolling mean/std of the patient's own prior sessions in that domain —
 * never against a population baseline, since this app never sees other
 * patients' data.
 */
export function detectAnomalies(points: TrendPoint[]): AnomalyFlag[] {
  const sorted = [...points].sort((a, b) => a.timestamp - b.timestamp);
  const flags: AnomalyFlag[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const windowStart = Math.max(0, i - ANOMALY_WINDOW);
    const baseline = sorted.slice(windowStart, i);
    if (baseline.length < MIN_BASELINE_SIZE) continue;

    const values = baseline.map((p) => p.accuracy * 100);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    const std = Math.sqrt(variance);
    if (std < MIN_MEANINGFUL_STD) continue;

    const current = sorted[i].accuracy * 100;
    const zScore = (current - mean) / std;
    if (Math.abs(zScore) >= ANOMALY_Z_THRESHOLD) {
      flags.push({
        timestamp: sorted[i].timestamp,
        accuracy: sorted[i].accuracy,
        zScore,
        reason:
          zScore < 0
            ? `unusually low score (${Math.round(current)}%) vs this patient's recent average of ${Math.round(mean)}%`
            : `unusually high score (${Math.round(current)}%) vs this patient's recent average of ${Math.round(mean)}%`,
      });
    }
  }
  return flags;
}
