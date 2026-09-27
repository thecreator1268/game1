// L1=10/20 · L2=12/25 · L3=16/30 · L4=20/35 · L5=24/40 · L6=28/45 · L7=32/50 · L8=36/55 · L9=40/60 · L10=44/65
const LEVELS: Record<number, { gridSize: number; distractorPct: number }> = {
  1: { gridSize: 10, distractorPct: 20 },
  2: { gridSize: 12, distractorPct: 25 },
  3: { gridSize: 16, distractorPct: 30 },
  4: { gridSize: 20, distractorPct: 35 },
  5: { gridSize: 24, distractorPct: 40 },
  6: { gridSize: 28, distractorPct: 45 },
  7: { gridSize: 32, distractorPct: 50 },
  8: { gridSize: 36, distractorPct: 55 },
  9: { gridSize: 40, distractorPct: 60 },
  10: { gridSize: 44, distractorPct: 65 },
};

export function paramsForLevel(level: number) {
  return LEVELS[level] ?? LEVELS[1];
}

export const PATTERN_COLORS = [
  { id: 'saffron', hex: '#b8440e' },
  { id: 'teal', hex: '#0d5c5c' },
  { id: 'crimson', hex: '#8b1a1a' },
  { id: 'indigo', hex: '#1a3c6e' },
  { id: 'amber', hex: '#b45309' },
];

// Capped at 4 columns regardless of grid size: each tile is a tap-target
// (64px minimum, non-negotiable), and at a phone-width viewport a 5th+
// fixed-min-width column no longer fits — the grid overflowed horizontally
// instead of shrinking (confirmed via a real mobile Playwright check). Tile
// position carries no meaning here (it's a tap-any-matching-tile scan, not
// a spatial-pattern task), so more tiles just means more rows.
export function gridColumnsForSize(_gridSize: number): number {
  return 4;
}
