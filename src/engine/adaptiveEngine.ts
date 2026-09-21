// Explainable staircase adaptive-difficulty engine.
//
// Every level-up / level-down decision is logged with a human-readable reason
// string (see LevelChange in db/types.ts) and surfaced verbatim in the
// caregiver dashboard's "Adaptive engine log" — the algorithm is designed to
// be auditable by a non-technical caregiver, not a black box.
//
// What feeds the level-up / level-down thresholds is the patient's mastery
// estimate for the game's domain, from Bayesian Knowledge Tracing (bkt.ts,
// persisted by masteryService.ts) — a named probabilistic model, not a
// rolling accuracy average. The rules around it are unchanged and still
// simple and on-device: a 5-attempt window at the current level, a
// response-time trend before levelling up, and an early level-down when error
// rate rises two sessions running. No training data is needed.
//
// A level-up needs BOTH the domain mastery estimate >= 0.80 AND this game's own
// last-5-session accuracy >= 80%. The estimate is shared by every game in a
// domain, so alone it lets an easy game promote a harder one (an easy game at
// 100% alternating with a hard one at 45% lifts it past 0.80 while the hard
// game's own window sits at 45%). Level-down does not have this second check.
//
// BKT's parameters are literature-typical starting priors, not values fitted
// to patients (see bkt.ts). Calibrating them from real patient data is the
// named next step once a deployed cohort exists; the call shape (level +
// recent attempts + mastery in, a level decision + reason out) would not change.

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 10;
export const WINDOW_SIZE = 5;
/** Level up when the domain's mastery estimate is at least this. */
export const LEVEL_UP_MASTERY_THRESHOLD = 0.8;
/**
 * A level-up also needs this game's own last-window accuracy to reach this.
 * The mastery estimate is shared by every game in a domain, so on its own it
 * would let an easy game promote a harder one (see bkt.ts). Level-up only; the
 * level-down side is unchanged.
 */
export const LEVEL_UP_OWN_ACCURACY_THRESHOLD = 0.8;
/** Level down when the domain's mastery estimate is below this. */
export const LEVEL_DOWN_MASTERY_THRESHOLD = 0.4;

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
 * Decide the next difficulty level for a game, given the current level, the
 * patient's most recent attempts AT that level (oldest first, newest last;
 * length should be <= WINDOW_SIZE — callers pass at most the last WINDOW_SIZE
 * sessions for this patient+game+level) and the patient's current BKT mastery
 * estimate `mastery` (0-1) for the game's domain, already updated for the
 * latest attempt.
 */
export function decideNextLevel(
  currentLevel: number,
  history: AttemptResult[],
  mastery: number,
): LevelDecision {
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
  // Display only (it goes into the log line); the decision below uses `mastery`.
  const correctCount = Math.round(mean(window.map((h) => h.accuracy)) * window.length);
  const incorrectCount = window.length - correctCount;
  // The estimate is shared by every game in this domain, while the tally is this
  // game's own last sessions; the wording names both so a line never reads as a
  // contradiction (e.g. a level-down that follows 5 correct sessions in this
  // game because other games in the domain pulled the estimate down).
  const tally = `this game's last ${window.length} sessions: ${correctCount} correct, ${incorrectCount} incorrect`;
  const masteryText = `domain mastery estimate ${mastery.toFixed(2)}`;
  const upBar = LEVEL_UP_MASTERY_THRESHOLD.toFixed(2);
  const downBar = LEVEL_DOWN_MASTERY_THRESHOLD.toFixed(2);
  const ownMean = mean(window.map((h) => h.accuracy));
  // Floored so the shown percentage never reads as meeting the bar when it doesn't
  // (79.6% must not print as "80%"); the epsilon absorbs float error at exactly 80%.
  const ownPct = Math.floor(ownMean * 100 + 1e-9);
  const ownBar = Math.round(LEVEL_UP_OWN_ACCURACY_THRESHOLD * 100);
  const ownText = `this game's own last ${window.length} sessions averaged ${ownPct}%`;
  const ownMet = ownMean + 1e-9 >= LEVEL_UP_OWN_ACCURACY_THRESHOLD;
  const avgResponseSec = mean(window.map((h) => h.avgResponseMs)) / 1000;

  if (mastery < LEVEL_DOWN_MASTERY_THRESHOLD) {
    const newLevel = clampLevel(currentLevel - 1);
    return {
      newLevel,
      changed: newLevel !== currentLevel,
      direction: newLevel !== currentLevel ? 'down' : 'hold',
      reason: `leveled down: ${masteryText} (below ${downBar}); ${tally}`,
    };
  }

  if (mastery >= LEVEL_UP_MASTERY_THRESHOLD) {
    if (!ownMet) {
      return {
        newLevel: currentLevel,
        changed: false,
        direction: 'hold',
        reason: `holding: ${masteryText} (at least ${upBar}) but ${ownText} (below ${ownBar}%)`,
      };
    }

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
        reason: `leveled up: ${masteryText} (at least ${upBar}) and ${ownText} (at least ${ownBar}%); avg ${avgResponseSec.toFixed(1)}s`,
      };
    }

    return {
      newLevel: currentLevel,
      changed: false,
      direction: 'hold',
      reason: `holding: ${masteryText} (at least ${upBar}) and ${ownText} (at least ${ownBar}%) but response time not yet improving`,
    };
  }

  return {
    newLevel: currentLevel,
    changed: false,
    direction: 'hold',
    reason: `holding: ${masteryText} (between ${downBar} and ${upBar}); ${tally}`,
  };
}

export function isPersonalBest(level: number): boolean {
  return level >= 6;
}
