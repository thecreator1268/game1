import type { Domain } from '@/db/types';

// Validated categorical palette (dataviz skill, references/palette.md, slots
// 1-5): worst adjacent CVD ΔE 9.1, worst adjacent normal-vision ΔE 19.6 — both
// clear the pass floors. Fixed order, never cycled or reassigned by filters.
export const DOMAIN_COLOR: Record<Domain, string> = {
  memory: '#2a78d6', // blue
  attention: '#eb6834', // orange
  routine: '#1baf7a', // aqua
  pattern: '#eda100', // yellow
  orientation: '#e87ba4', // magenta
};
