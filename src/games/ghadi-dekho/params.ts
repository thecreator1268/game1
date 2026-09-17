// Difficulty scales two independent ways, both grounded in how the Clock
// Drawing Test itself gets harder: how fine-grained the target time can be
// (L1 = whole hours only; L10 = any minute) and how visually close the
// wrong-answer times are to the right one (a clock reading of 3:05 vs 3:10
// is a much harder discrimination than 3:00 vs 9:00).
// L1=60min/3opt/180spread ... L10=1min/5opt/5spread
interface GhadiDekhoParams {
  granularityMinutes: number;
  optionCount: number;
  spreadMinutes: number;
}

const LEVELS: Record<number, GhadiDekhoParams> = {
  1: { granularityMinutes: 60, optionCount: 3, spreadMinutes: 180 },
  2: { granularityMinutes: 60, optionCount: 3, spreadMinutes: 120 },
  3: { granularityMinutes: 30, optionCount: 3, spreadMinutes: 90 },
  4: { granularityMinutes: 30, optionCount: 4, spreadMinutes: 60 },
  5: { granularityMinutes: 15, optionCount: 4, spreadMinutes: 45 },
  6: { granularityMinutes: 15, optionCount: 4, spreadMinutes: 30 },
  7: { granularityMinutes: 5, optionCount: 5, spreadMinutes: 20 },
  8: { granularityMinutes: 5, optionCount: 5, spreadMinutes: 15 },
  9: { granularityMinutes: 1, optionCount: 5, spreadMinutes: 10 },
  10: { granularityMinutes: 1, optionCount: 5, spreadMinutes: 5 },
};

export function paramsForLevel(level: number): GhadiDekhoParams {
  return LEVELS[level] ?? LEVELS[1];
}

export const TRIALS_PER_SESSION = 5;
export const MINUTES_IN_12H = 12 * 60;

export function normalizeMinutes(total: number): number {
  return ((total % MINUTES_IN_12H) + MINUTES_IN_12H) % MINUTES_IN_12H;
}

export function formatClockTime(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const displayHour = hour === 0 ? 12 : hour;
  return `${displayHour}:${String(minute).padStart(2, '0')}`;
}

export interface ClockTrial {
  totalMinutes: number;
  optionsMinutes: number[];
}

export function buildClockTrial(level: number): ClockTrial {
  const { granularityMinutes, optionCount, spreadMinutes } = paramsForLevel(level);
  const steps = MINUTES_IN_12H / granularityMinutes;
  const target = Math.floor(Math.random() * steps) * granularityMinutes;

  const spreadSteps = Math.max(1, Math.round(spreadMinutes / granularityMinutes));
  const decoys = new Set<number>();
  let attempts = 0;
  while (decoys.size < optionCount - 1 && attempts < 200) {
    attempts++;
    const offsetSteps = Math.floor(Math.random() * (2 * spreadSteps + 1)) - spreadSteps;
    if (offsetSteps === 0) continue;
    const candidate = normalizeMinutes(target + offsetSteps * granularityMinutes);
    if (candidate === target) continue;
    decoys.add(candidate);
  }
  // Only realistically reached at tiny granularity/spread combinations where
  // the offset range can't produce enough distinct candidates — widen to any
  // valid step on the clock rather than loop forever.
  while (decoys.size < optionCount - 1) {
    const candidate = Math.floor(Math.random() * steps) * granularityMinutes;
    if (candidate !== target) decoys.add(candidate);
  }

  const optionsMinutes = [target, ...Array.from(decoys).slice(0, optionCount - 1)];
  for (let i = optionsMinutes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [optionsMinutes[i], optionsMinutes[j]] = [optionsMinutes[j], optionsMinutes[i]];
  }

  return { totalMinutes: target, optionsMinutes };
}
