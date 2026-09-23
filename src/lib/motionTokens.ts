// Shared timing/easing tokens for every Motion (`motion/react`)-driven
// animation in the app — the JS-side mirror of the CSS custom properties in
// src/index.css's "Shared motion timing tokens" block (Motion's transition
// config takes numbers/arrays, not `var(--x)` strings, so the same three
// values are duplicated here rather than read from CSS). Keep both in sync.
//
// Three buckets, picked by what the animation is FOR, not hand-tuned per
// component: fast for press/hover feedback, medium for state transitions
// (toggle/tab swaps, modal entrance/exit), slow for data reveals (chart
// bars/lines, stat count-ups). This is the single place those numbers live —
// see the 2026 exhaustive motion pass for the audit that found timings had
// drifted per-component before this existed.

/** Press/hover feedback — perceived as instant but not jarring. */
export const MOTION_FAST_MS = 120;
/** State transitions: toggle/tab swaps, modal and toast entrance/exit. */
export const MOTION_MEDIUM_MS = 240;
/** Data reveals: chart bars/lines, stat count-ups. */
export const MOTION_SLOW_MS = 650;

/**
 * A calm, no-overshoot ease for anything Patient Mode can see. Tier-2 spring
 * overshoot (domain bars, level-up badge, splash) stays hand-specified at its
 * 3 existing call sites — a deliberately different, more elaborate feel for
 * those caregiver/celebration-only spots, not something to fold into this
 * shared token.
 */
export const EASE_STANDARD = [0.4, 0, 0.2, 1] as const;
