const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS_PER_WEEK = 7;

// A week counts as "consistent" once the patient played on at least this many
// distinct days — 3 of 7 mirrors the habit-tracking threshold this project's
// adherence streak already uses informally, without demanding daily play.
const MIN_DAYS_FOR_CONSISTENT_WEEK = 3;

// Caps the plant's growth so a very long history doesn't need more than 5
// visually distinct illustration stages (see GardenGrowthCard's GardenSvg).
export const MAX_GARDEN_STAGE = 5;

function dayKey(timestamp: number): string {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export interface GardenGrowthResult {
  consistentWeeks: number;
  stage: number;
}

export function computeGardenGrowth(
  sessionTimestamps: number[],
  weeksToLookBack = 12,
  now: number = Date.now(),
): GardenGrowthResult {
  const playedDays = new Set(sessionTimestamps.map(dayKey));

  let consistentWeeks = 0;
  for (let week = 0; week < weeksToLookBack; week++) {
    let daysPlayedThisWeek = 0;
    for (let day = 0; day < DAYS_PER_WEEK; day++) {
      const ts = now - (week * DAYS_PER_WEEK + day) * DAY_MS;
      if (playedDays.has(dayKey(ts))) daysPlayedThisWeek++;
    }
    if (daysPlayedThisWeek >= MIN_DAYS_FOR_CONSISTENT_WEEK) consistentWeeks++;
  }

  return { consistentWeeks, stage: Math.min(consistentWeeks, MAX_GARDEN_STAGE) };
}
