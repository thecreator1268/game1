function dayKey(timestamp: number): string {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

// A day still counts toward "today" until it ends, so a patient who hasn't
// played yet this morning shouldn't see yesterday's streak read as broken —
// only a fully skipped day breaks it.
export function computePlayStreak(sessionTimestamps: number[], now: number = Date.now()): number {
  const playedDays = new Set(sessionTimestamps.map(dayKey));
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  if (!playedDays.has(dayKey(cursor.getTime()))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (playedDays.has(dayKey(cursor.getTime()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
