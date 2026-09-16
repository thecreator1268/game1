// L1=10/20 · L2=12/25 · L3=16/30 · L4=20/35 · L5=24/40 · L6=28/45 · L7=32/50 · L8=36/55
const LEVELS: Record<number, { gridSize: number; distractorPct: number }> = {
  1: { gridSize: 10, distractorPct: 20 },
  2: { gridSize: 12, distractorPct: 25 },
  3: { gridSize: 16, distractorPct: 30 },
  4: { gridSize: 20, distractorPct: 35 },
  5: { gridSize: 24, distractorPct: 40 },
  6: { gridSize: 28, distractorPct: 45 },
  7: { gridSize: 32, distractorPct: 50 },
  8: { gridSize: 36, distractorPct: 55 },
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

export function gridColumnsForSize(gridSize: number): number {
  if (gridSize <= 12) return 4;
  if (gridSize <= 20) return 5;
  if (gridSize <= 28) return 6;
  return 7;
}
