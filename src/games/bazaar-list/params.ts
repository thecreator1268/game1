// L1=2/8 · L2=3/8 · L3=3/12 · L4=4/12 · L5=4/16 · L6=5/16 · L7=5/20 · L8=6/20 · L9=7/24 · L10=8/24 (list length / grid size)
const LEVELS: Record<number, { listLength: number; gridSize: number }> = {
  1: { listLength: 2, gridSize: 8 },
  2: { listLength: 3, gridSize: 8 },
  3: { listLength: 3, gridSize: 12 },
  4: { listLength: 4, gridSize: 12 },
  5: { listLength: 4, gridSize: 16 },
  6: { listLength: 5, gridSize: 16 },
  7: { listLength: 5, gridSize: 20 },
  8: { listLength: 6, gridSize: 20 },
  9: { listLength: 7, gridSize: 24 },
  10: { listLength: 8, gridSize: 24 },
};

export function paramsForLevel(level: number) {
  return LEVELS[level] ?? LEVELS[1];
}

// Capped at 4 columns regardless of grid size — see dhyan-dhaam/params.ts's
// gridColumnsForSize comment for why (64px tap-target minimum + phone-width
// viewports don't fit a 5th fixed-min-width column; confirmed via a real
// mobile Playwright check). Item position carries no gameplay meaning here.
export function gridColumnsForSize(_gridSize: number): number {
  return 4;
}
