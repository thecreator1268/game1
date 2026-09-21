import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BKT_PARAMS,
  posteriorGivenObservation,
  replayMastery,
  updateMastery,
  updateMasteryFromAccuracy,
  validateBktParams,
  type BktParams,
} from './bkt';
import { LEVEL_DOWN_MASTERY_THRESHOLD, LEVEL_UP_MASTERY_THRESHOLD } from './adaptiveEngine';

const { pL0, pT, pS, pG } = DEFAULT_BKT_PARAMS;

/** Apply the same answer `n` times, returning every intermediate estimate. */
function repeat(start: number, correct: boolean, n: number, params?: BktParams): number[] {
  const out: number[] = [];
  let pL = start;
  for (let i = 0; i < n; i++) {
    pL = updateMastery(pL, correct, params);
    out.push(pL);
  }
  return out;
}

// Small seeded PRNG so the property-style tests are reproducible.
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

describe('default parameters', () => {
  it('are the stated literature-typical priors', () => {
    expect(DEFAULT_BKT_PARAMS).toEqual({ pL0: 0.3, pT: 0.1, pS: 0.1, pG: 0.2 });
  });
});

describe('the update equations, checked by hand', () => {
  it('correct answer from pL = 0.3', () => {
    // posterior = 0.3*0.9 / (0.3*0.9 + 0.7*0.2) = 0.27 / 0.41
    const posterior = 0.27 / 0.41;
    expect(posteriorGivenObservation(0.3, true)).toBeCloseTo(posterior, 12);
    // next = posterior + (1 - posterior) * 0.1
    expect(updateMastery(0.3, true)).toBeCloseTo(posterior + (1 - posterior) * 0.1, 12);
    expect(updateMastery(0.3, true)).toBeCloseTo(0.692683, 5);
  });

  it('incorrect answer from pL = 0.3', () => {
    // posterior = 0.3*0.1 / (0.3*0.1 + 0.7*0.8) = 0.03 / 0.59
    const posterior = 0.03 / 0.59;
    expect(posteriorGivenObservation(0.3, false)).toBeCloseTo(posterior, 12);
    expect(updateMastery(0.3, false)).toBeCloseTo(posterior + (1 - posterior) * 0.1, 12);
    expect(updateMastery(0.3, false)).toBeCloseTo(0.145763, 5);
  });

  it('uses the supplied parameters, not just the defaults', () => {
    const params: BktParams = { pL0: 0.5, pT: 0.25, pS: 0.05, pG: 0.3 };
    const posterior = (0.5 * 0.95) / (0.5 * 0.95 + 0.5 * 0.3);
    expect(updateMastery(0.5, true, params)).toBeCloseTo(posterior + (1 - posterior) * 0.25, 12);
  });
});

describe('direction of change', () => {
  it('a correct answer raises the estimate, from any starting point strictly between 0 and 1', () => {
    for (const start of [0.02, 0.1, 0.3, 0.5, 0.7, 0.9, 0.98]) {
      expect(updateMastery(start, true)).toBeGreaterThan(start);
    }
  });

  it('an incorrect answer lowers the estimate when it is above the learning floor', () => {
    for (const start of [0.3, 0.5, 0.7, 0.9, 0.98]) {
      expect(updateMastery(start, false)).toBeLessThan(start);
    }
  });

  it('a correct answer helps more than an incorrect one', () => {
    expect(updateMastery(0.5, true)).toBeGreaterThan(updateMastery(0.5, false));
  });
});

describe('convergence', () => {
  it('sustained correct answers converge toward 1.0', () => {
    const path = repeat(pL0, true, 12);
    // strictly increasing, and essentially certain by the 12th
    for (let i = 1; i < path.length; i++) expect(path[i]).toBeGreaterThan(path[i - 1]);
    expect(path.at(-1)!).toBeGreaterThan(0.999);
    expect(path.at(-1)!).toBeLessThanOrEqual(1);
  });

  it('sustained incorrect answers fall steadily below the level-down threshold and level off at a small floor', () => {
    const path = repeat(pL0, false, 60);
    expect(path[2]).toBeLessThan(LEVEL_DOWN_MASTERY_THRESHOLD); // 3 wrong answers are enough
    const floor = path.at(-1)!;
    // With a learning probability above zero the estimate cannot reach 0: every
    // opportunity still carries a pT chance of learning. It settles near 0.11.
    expect(floor).toBeGreaterThan(0.1);
    expect(floor).toBeLessThan(0.13);
    expect(Math.abs(path.at(-1)! - path.at(-2)!)).toBeLessThan(1e-9); // converged
  });

  it('with no learning (pT = 0), sustained incorrect answers converge toward 0', () => {
    const noLearning: BktParams = { ...DEFAULT_BKT_PARAMS, pT: 0 };
    const path = repeat(pL0, false, 20, noLearning);
    for (let i = 1; i < path.length; i++) expect(path[i]).toBeLessThan(path[i - 1]);
    expect(path.at(-1)!).toBeLessThan(1e-9);
    expect(path.at(-1)!).toBeGreaterThanOrEqual(0);
  });

  it('recovers: a run of wrong answers followed by correct ones climbs back up', () => {
    const low = repeat(pL0, false, 6).at(-1)!;
    const recovered = repeat(low, true, 4).at(-1)!;
    expect(recovered).toBeGreaterThan(LEVEL_UP_MASTERY_THRESHOLD);
  });
});

describe('the estimate never leaves [0, 1]', () => {
  it('holds over long random answer streams, for random valid parameters', () => {
    const rand = lcg(20260921);
    for (let run = 0; run < 200; run++) {
      const params: BktParams = { pL0: rand(), pT: rand(), pS: rand(), pG: rand() };
      let pL = params.pL0;
      for (let step = 0; step < 200; step++) {
        pL = updateMastery(pL, rand() < 0.5, params);
        expect(Number.isFinite(pL)).toBe(true);
        expect(pL).toBeGreaterThanOrEqual(0);
        expect(pL).toBeLessThanOrEqual(1);
      }
    }
  });

  it('holds at the extremes of the parameters and of pL itself', () => {
    const extremes = [0, 1];
    for (const pS_ of extremes) {
      for (const pG_ of extremes) {
        for (const pT_ of extremes) {
          const params: BktParams = { pL0: 0.5, pT: pT_, pS: pS_, pG: pG_ };
          for (const start of [0, 0.5, 1]) {
            for (const correct of [true, false]) {
              const next = updateMastery(start, correct, params);
              expect(Number.isFinite(next)).toBe(true);
              expect(next).toBeGreaterThanOrEqual(0);
              expect(next).toBeLessThanOrEqual(1);
            }
          }
        }
      }
    }
  });

  it('clamps an out-of-range or non-finite starting estimate instead of propagating it', () => {
    expect(updateMastery(1.7, true)).toBeLessThanOrEqual(1);
    expect(updateMastery(-0.4, false)).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(updateMastery(Number.NaN, true))).toBe(true);
  });
});

describe('updateMasteryFromAccuracy (one session = one opportunity)', () => {
  it('is exactly the standard update for a fully correct or fully incorrect session', () => {
    for (const start of [0.1, 0.3, 0.6, 0.9]) {
      expect(updateMasteryFromAccuracy(start, 1)).toBeCloseTo(updateMastery(start, true), 12);
      expect(updateMasteryFromAccuracy(start, 0)).toBeCloseTo(updateMastery(start, false), 12);
    }
  });

  it('rises monotonically with the session accuracy', () => {
    let previous = -1;
    for (let a = 0; a <= 1.0001; a += 0.1) {
      const next = updateMasteryFromAccuracy(0.5, a);
      expect(next).toBeGreaterThan(previous);
      previous = next;
    }
  });

  it('lies between the fully incorrect and fully correct results', () => {
    const low = updateMastery(0.4, false);
    const high = updateMastery(0.4, true);
    const mid = updateMasteryFromAccuracy(0.4, 0.5);
    expect(mid).toBeGreaterThan(low);
    expect(mid).toBeLessThan(high);
  });

  it('treats a non-finite accuracy as no evidence, and clamps out-of-range accuracy', () => {
    expect(updateMasteryFromAccuracy(0.42, Number.NaN)).toBe(0.42);
    expect(updateMasteryFromAccuracy(0.42, Number.POSITIVE_INFINITY)).toBe(0.42);
    expect(updateMasteryFromAccuracy(0.42, 1.5)).toBeCloseTo(updateMasteryFromAccuracy(0.42, 1), 12);
    expect(updateMasteryFromAccuracy(0.42, -2)).toBeCloseTo(updateMasteryFromAccuracy(0.42, 0), 12);
  });
});

describe('replayMastery', () => {
  it('is the prior for no history', () => {
    expect(replayMastery([])).toBe(pL0);
  });

  it('equals applying the updates one by one', () => {
    const accuracies = [0.9, 0.4, 1, 0.7, 0.2, 0.8];
    let pL = pL0;
    for (const a of accuracies) pL = updateMasteryFromAccuracy(pL, a);
    expect(replayMastery(accuracies)).toBeCloseTo(pL, 12);
  });

  it('weights recent sessions more than old ones', () => {
    const improving = replayMastery([0.2, 0.2, 0.2, 0.9, 0.9, 0.9]);
    const declining = replayMastery([0.9, 0.9, 0.9, 0.2, 0.2, 0.2]);
    expect(improving).toBeGreaterThan(declining);
  });
});

describe('why sessions are weighted by accuracy, not cut into right/wrong', () => {
  // Five sessions at a steady accuracy. The previous engine compared the mean
  // accuracy to 0.4 / 0.8, so 55-70% held, 80%+ levelled up, ~30% levelled down.
  const band = (pL: number) =>
    pL >= LEVEL_UP_MASTERY_THRESHOLD ? 'up' : pL < LEVEL_DOWN_MASTERY_THRESHOLD ? 'down' : 'hold';
  const steady = (accuracy: number) => Array.from({ length: 5 }, () => accuracy);

  it('the accuracy-weighted estimate keeps the same three bands the old rule had', () => {
    expect(band(replayMastery(steady(0.55)))).toBe('hold');
    expect(band(replayMastery(steady(0.6)))).toBe('hold');
    expect(band(replayMastery(steady(0.7)))).toBe('hold');
    expect(band(replayMastery(steady(0.8)))).toBe('up');
    expect(band(replayMastery(steady(0.95)))).toBe('up');
    expect(band(replayMastery(steady(0.3)))).toBe('down');
  });

  it('a hard right/wrong cut-off would not: 55% would level UP, or 70% would level DOWN', () => {
    const binary = (cutoff: number, accuracy: number) =>
      steady(accuracy).reduce((pL, a) => updateMastery(pL, a >= cutoff), pL0);
    expect(band(binary(0.5, 0.55))).toBe('up'); // "correct if >= 50%": promotes a 55% patient
    expect(band(binary(0.8, 0.7))).toBe('down'); // "correct if >= 80%": demotes a steady 70% patient
  });

  it('the constants match the documented priors so the numbers above stay honest', () => {
    expect([pT, pS, pG]).toEqual([0.1, 0.1, 0.2]);
  });
});

describe('validateBktParams', () => {
  it('accepts probabilities and rejects anything else', () => {
    expect(() => validateBktParams(DEFAULT_BKT_PARAMS)).not.toThrow();
    expect(() => validateBktParams({ ...DEFAULT_BKT_PARAMS, pS: 1.2 })).toThrow(RangeError);
    expect(() => validateBktParams({ ...DEFAULT_BKT_PARAMS, pG: -0.1 })).toThrow(RangeError);
    expect(() => validateBktParams({ ...DEFAULT_BKT_PARAMS, pT: Number.NaN })).toThrow(RangeError);
  });
});
