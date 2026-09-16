// L1=4 · L2=6 · L3=8 · L4=10 · L5=12 · L6=15 · L7=18 · L8=21 · L9=24 · L10=28 (pieces in the assembly)
const GRID_BY_LEVEL: Record<number, { rows: number; cols: number }> = {
  1: { rows: 2, cols: 2 },
  2: { rows: 2, cols: 3 },
  3: { rows: 2, cols: 4 },
  4: { rows: 2, cols: 5 },
  5: { rows: 3, cols: 4 },
  6: { rows: 3, cols: 5 },
  7: { rows: 3, cols: 6 },
  8: { rows: 3, cols: 7 },
  9: { rows: 4, cols: 6 },
  10: { rows: 4, cols: 7 },
};

export function gridForLevel(level: number) {
  return GRID_BY_LEVEL[level] ?? GRID_BY_LEVEL[1];
}

// Placeholder "picture" content: a generated radial mosaic rather than
// commissioned regional artwork (bamboo hut / boat / mountain outlines) —
// see README known-limitations for the real-asset follow-up.
export const MOSAIC_COLORS = ['#0d5c5c', '#b8440e', '#1a3c6e', '#b45309'];

export function buildMosaic(rows: number, cols: number): string[] {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const maxDist = Math.hypot(cx, cy) || 1;
  const cells: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dist = Math.hypot(c - cx, r - cy);
      const ring = Math.min(
        MOSAIC_COLORS.length - 1,
        Math.floor((dist / maxDist) * (MOSAIC_COLORS.length - 1) + 0.0001),
      );
      cells.push(MOSAIC_COLORS[ring]);
    }
  }
  return cells;
}
