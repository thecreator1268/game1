// Bayesian Knowledge Tracing (BKT): a small, real probabilistic model of
// whether a patient has "mastered" a cognitive domain, updated after every
// game attempt. It feeds the adaptive-difficulty engine (adaptiveEngine.ts),
// which keeps its explainable level-up / level-down thresholds and its
// human-readable log; BKT only replaces the rolling accuracy average that used
// to be compared against those thresholds.
//
// MODEL. A hidden state L ("mastered" or not) per patient and domain, and four
// numbers (Corbett & Anderson, "Knowledge tracing: Modeling the acquisition of
// procedural knowledge", User Modeling and User-Adapted Interaction
// 4(4):253-278, 1995):
//   pL0  prior probability of mastery before any attempts
//   pT   probability of learning (moving to mastered) at each opportunity
//   pS   probability of a slip: answering wrongly despite mastery
//   pG   probability of a guess: answering rightly without mastery
// After an observation, Bayes' rule gives the posterior, then a learning step:
//   correct:   P(L|obs) = pL(1-pS) / ( pL(1-pS) + (1-pL)pG )
//   incorrect: P(L|obs) = pL pS    / ( pL pS    + (1-pL)(1-pG) )
//   pL_next  = P(L|obs) + (1 - P(L|obs)) pT
//
// PARAMETERS ARE PRIORS, NOT FITTED. The defaults below are conventional
// starting values, in the range commonly used in the BKT literature
// (Corbett & Anderson-style priors). They were NOT learned from patient data
// and are not a claim about this population. Calibrating them per domain from
// real patient data is a named next step once a deployed cohort exists. No
// training data is needed to run the model, which is why BKT fits an offline,
// on-device, pre-data setting.
//
// ONE OPPORTUNITY PER SESSION, WEIGHTED BY ACCURACY. Games report a
// session-level accuracy (0-1), not individual round outcomes, so each
// finished session is one opportunity. Two ways to turn it into an
// observation were tested against the previous accuracy-average rule
// (5 sessions at a steady accuracy, thresholds 0.4 / 0.8):
//   steady 55-70%: old rule hold | "correct if >= 50%" LEVELS UP (pL 1.00)
//                                | "correct if >= 80%" LEVELS DOWN (pL 0.11)
//                                | accuracy-weighted hold (pL 0.58-0.76)
// A hard cut-off would promote a patient who is right only 55% of the time,
// or demote one who is steady at 70%, so `updateMasteryFromAccuracy` weights
// the two branches by the session's accuracy a:
//   P(L|obs) = a * P(L|correct) + (1 - a) * P(L|incorrect)
// For a = 1 or a = 0 this is exactly the standard update above. It is a
// documented adaptation, not the textbook per-item form; per-round evidence
// would need the games to report it (a next step).
//
// LIMITS worth knowing: there is one estimate per domain, shared by that
// domain's games and levels (it is not level-specific), and because pT > 0 a
// run of wrong answers levels off at a floor near 0.11 rather than at exactly 0.

export interface BktParams {
  /** Prior probability of mastery before any attempts. */
  pL0: number;
  /** Probability of learning at each opportunity. */
  pT: number;
  /** Probability of slipping: wrong despite mastery. */
  pS: number;
  /** Probability of guessing: right despite no mastery. */
  pG: number;
}

export const DEFAULT_BKT_PARAMS: Readonly<BktParams> = Object.freeze({
  pL0: 0.3,
  pT: 0.1,
  pS: 0.1,
  pG: 0.2,
});

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** Throws if any parameter is not a probability. Call before using custom params. */
export function validateBktParams(params: BktParams): void {
  for (const [name, value] of Object.entries(params)) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new RangeError(`BKT parameter ${name} must be a probability in [0, 1], got ${value}`);
    }
  }
}

/** Bayes step only: P(mastered | one observation), before the learning step. */
export function posteriorGivenObservation(
  pL: number,
  correct: boolean,
  params: BktParams = DEFAULT_BKT_PARAMS,
): number {
  const p = Number.isFinite(pL) ? clamp01(pL) : params.pL0;
  const numerator = correct ? p * (1 - params.pS) : p * params.pS;
  const denominator = correct
    ? p * (1 - params.pS) + (1 - p) * params.pG
    : p * params.pS + (1 - p) * (1 - params.pG);
  // A zero denominator means the observation is impossible under these
  // parameters (e.g. pS = 0 and a wrong answer at pL = 1): keep the estimate.
  return denominator > 0 ? clamp01(numerator / denominator) : p;
}

function learn(posterior: number, params: BktParams): number {
  return clamp01(posterior + (1 - posterior) * params.pT);
}

/** The standard BKT update for one correct/incorrect answer. */
export function updateMastery(
  pL: number,
  correct: boolean,
  params: BktParams = DEFAULT_BKT_PARAMS,
): number {
  return learn(posteriorGivenObservation(pL, correct, params), params);
}

/**
 * Update from a session's accuracy (0-1). Equals `updateMastery` at 0 and 1;
 * in between, the correct and incorrect posteriors are mixed by the accuracy.
 * A non-finite accuracy carries no evidence, so the estimate is unchanged.
 */
export function updateMasteryFromAccuracy(
  pL: number,
  accuracy: number,
  params: BktParams = DEFAULT_BKT_PARAMS,
): number {
  const p = Number.isFinite(pL) ? clamp01(pL) : params.pL0;
  if (!Number.isFinite(accuracy)) return p;
  const a = clamp01(accuracy);
  const posterior =
    a * posteriorGivenObservation(p, true, params) + (1 - a) * posteriorGivenObservation(p, false, params);
  return learn(posterior, params);
}

/** Mastery after a whole history of sessions (oldest first), starting from pL0. */
export function replayMastery(accuracies: number[], params: BktParams = DEFAULT_BKT_PARAMS): number {
  return accuracies.reduce((pL, accuracy) => updateMasteryFromAccuracy(pL, accuracy, params), params.pL0);
}
