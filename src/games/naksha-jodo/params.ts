// L1=4 · L2=6 · L3=8 · L4=12 · L5=16 · L6=20 · L7=24 · L8=28 · L9=32 · L10=36
// (pieces in the assembly). Columns are capped at 4: the assembly slots are
// tap-targets (64px minimum, non-negotiable), and the drop-zone grid's
// column count is baked into the puzzle's actual layout (buildMosaic()
// generates the picture from this exact rows×cols shape, so it can't be
// re-flowed to fewer columns at render time the way a plain content grid
// could — the fix has to be in the level table itself). More pieces at
// higher levels now means more rows, never more columns, so the assembly
// grid always fits a phone-width viewport (confirmed via a real mobile
// Playwright check — the old table's L10 (4x7) overflowed by ~90px).
const GRID_BY_LEVEL: Record<number, { rows: number; cols: number }> = {
  1: { rows: 2, cols: 2 },
  2: { rows: 2, cols: 3 },
  3: { rows: 2, cols: 4 },
  4: { rows: 3, cols: 4 },
  5: { rows: 4, cols: 4 },
  6: { rows: 5, cols: 4 },
  7: { rows: 6, cols: 4 },
  8: { rows: 7, cols: 4 },
  9: { rows: 8, cols: 4 },
  10: { rows: 9, cols: 4 },
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
