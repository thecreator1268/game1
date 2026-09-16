// Explainable staircase adaptive-difficulty engine.
//
// Every level-up / level-down decision is logged with a human-readable reason
// string (see LevelChange in db/types.ts) and surfaced verbatim in the
// caregiver dashboard's "Adaptive engine log" — the algorithm is designed to
// be auditable by a non-technical caregiver, not a black box.
//
// EXTENSION POINT: this staircase rule is intentionally simple (accuracy +
// response-time trend over a rolling window) so it can run entirely on-device
// with no training data. A future version could replace `decideNextLevel`
// with a small per-patient Bayesian Knowledge Tracing or logistic-regression
// model trained on aggregated, anonymized session data across the deployed
// patient base — the call signature (level + recent attempt history in,
// a level decision + reason out) would stay the same, so nothing upstream
// (session logging, dashboard, UI) needs to change.

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 10;
export const WINDOW_SIZE = 5;
export const LEVEL_UP_ACCURACY_THRESHOLD = 0.8;
export const LEVEL_DOWN_ACCURACY_THRESHOLD = 0.4;

export interface AttemptResult {
  accuracy: number; // 0-1 for this session
  avgResponseMs: number;
  timestamp: number;
}

export type LevelDirection = 'up' | 'down' | 'hold';

export interface LevelDecision {
  newLevel: number;
  changed: boolean;
  direction: LevelDirection;
  reason: string;
}

function clampLevel(level: number): number {
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, level));
}

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mean(nums: number[]): number {
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

/**
 * Decide the next difficulty level for a game, given the current level and
 * the patient's most recent attempts AT that level (oldest first, newest
 * last; length should be <= WINDOW_SIZE — callers pass at most the last
 * WINDOW_SIZE sessions for this patient+game+level).
 */
export function decideNextLevel(currentLevel: number, history: AttemptResult[]): LevelDecision {
  if (history.length === 0) {
    return {
      newLevel: currentLevel,
      changed: false,
      direction: 'hold',
      reason: 'no attempts yet at this level',
    };
  }

  // Rule: 2 consecutive sessions of rising error rate → level down immediately,
  // even before a full window is available, so a struggling patient isn't
  // stuck failing repeatedly while data accumulates.
  if (history.length >= 3) {
    const lastThree = history.slice(-3);
    const errorRates = lastThree.map((h) => 1 - h.accuracy);
    if (errorRates[1] > errorRates[0] && errorRates[2] > errorRates[1]) {
      const newLevel = clampLevel(currentLevel - 1);
      const pct = errorRates.map((e) => `${Math.round(e * 100)}%`).join(' → ');
      return {
        newLevel,
        changed: newLevel !== currentLevel,
        direction: newLevel !== currentLevel ? 'down' : 'hold',
        reason: `leveled down: error rate rose for 2 sessions in a row (${pct})`,
      };
    }
  }

  if (history.length < WINDOW_SIZE) {
    return {
      newLevel: currentLevel,
      changed: false,
      direction: 'hold',
      reason: `gathering data (${history.length}/${WINDOW_SIZE} attempts at this level)`,
    };
  }

  const window = history.slice(-WINDOW_SIZE);
  const avgAccuracy = mean(window.map((h) => h.accuracy));
  const correctCount = Math.round(avgAccuracy * window.length);
  const avgResponseSec = mean(window.map((h) => h.avgResponseMs)) / 1000;

  if (avgAccuracy < LEVEL_DOWN_ACCURACY_THRESHOLD) {
    const newLevel = clampLevel(currentLevel - 1);
    return {
      newLevel,
      changed: newLevel !== currentLevel,
      direction: newLevel !== currentLevel ? 'down' : 'hold',
      reason: `leveled down: ${correctCount}/${window.length} correct (below 40% threshold)`,
    };
  }

  if (avgAccuracy >= LEVEL_UP_ACCURACY_THRESHOLD) {
    const times = window.map((h) => h.avgResponseMs);
    const half = Math.floor(times.length / 2);
    const earlier = times.slice(0, half);
    const later = times.slice(times.length - half);
    const trendingDown = median(later) <= median(earlier);

    if (trendingDown) {
      const newLevel = clampLevel(currentLevel + 1);
      return {
        newLevel,
        changed: newLevel !== currentLevel,
        direction: newLevel !== currentLevel ? 'up' : 'hold',
        reason: `leveled up: ${correctCount}/${window.length} correct, avg ${avgResponseSec.toFixed(1)}s`,
      };
    }

    return {
      newLevel: currentLevel,
      changed: false,
      direction: 'hold',
      reason: `holding: accuracy strong (${correctCount}/${window.length}) but response time not yet improving`,
    };
  }

  return {
    newLevel: currentLevel,
    changed: false,
    direction: 'hold',
    reason: `holding: steady performance (${correctCount}/${window.length} correct)`,
  };
}

export function isPersonalBest(level: number): boolean {
  return level >= 6;
}
