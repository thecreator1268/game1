// L1=2/8 · L2=3/8 · L3=3/12 · L4=4/12 · L5=4/16 · L6=5/16 · L7=5/20 · L8=6/20 (list length / grid size)
const LEVELS: Record<number, { listLength: number; gridSize: number }> = {
  1: { listLength: 2, gridSize: 8 },
  2: { listLength: 3, gridSize: 8 },
  3: { listLength: 3, gridSize: 12 },
  4: { listLength: 4, gridSize: 12 },
  5: { listLength: 4, gridSize: 16 },
  6: { listLength: 5, gridSize: 16 },
  7: { listLength: 5, gridSize: 20 },
  8: { listLength: 6, gridSize: 20 },
};

export function paramsForLevel(level: number) {
  return LEVELS[level] ?? LEVELS[1];
}

export function gridColumnsForSize(gridSize: number): number {
  if (gridSize <= 8) return 4;
  if (gridSize <= 12) return 4;
  return 5;
}
