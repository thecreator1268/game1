import type { Domain } from '@/db/types';
import type { IconName } from '@/components/IconSprite';

// "Indopendence" design system's fixed domain hues (theme-1) — see
// src/index.css's --domain-* tokens, which are what every card/bar/icon-chip
// in the app actually renders with (these two files must be kept in sync;
// this export exists only for the few call sites — Recharts fill props —
// that need a literal hex rather than a CSS custom property). Two of these
// five hues (coral/teal) sit at CVD ΔE 2.1 for protanopia — see index.css's
// theme comment for why that's mitigated (every use also carries an icon +
// text label) rather than re-picking hues the build brief specified exactly.
export const DOMAIN_COLOR: Record<Domain, string> = {
  memory: '#ffda57', // gold
  attention: '#7dcaf6', // malibu
  routine: '#00917a', // teal
  pattern: '#f47575', // coral
  orientation: '#a293ff', // lavender
};

// Full literal class names (not built via `game-card-${domain}` template
// interpolation at the call site) so Tailwind's content scanner — which
// only sees exact substrings present somewhere in source, not the runtime
// result of string interpolation — actually keeps these rules in the
// production build instead of silently tree-shaking them. Learned the hard
// way with the previous icon-blob-* pass; see git history.
export const DOMAIN_CARD_CLASS: Record<Domain, string> = {
  memory: 'game-card-memory',
  attention: 'game-card-attention',
  routine: 'game-card-routine',
  pattern: 'game-card-pattern',
  orientation: 'game-card-orientation',
};

// One icon per domain (not per game) — the caregiver domain-balance chart's
// avatar-above-a-bar, and anywhere else a domain needs a mark distinct from
// its color alone (see index.css's theme comment on why that matters for
// the coral/teal pair specifically).
export const DOMAIN_ICON: Record<Domain, IconName> = {
  memory: 'book',
  attention: 'target',
  routine: 'clock',
  pattern: 'flower',
  orientation: 'sun',
};

// Adaptive-log row tint — `color-mix(in srgb, <domain> 18%, surface)`, a
// literal class per domain for the same tree-shaking reason as
// DOMAIN_CARD_CLASS above (these are hand-written CSS classes in
// index.css, not Tailwind utilities, so they're never actually at risk of
// being purged — but the lookup-table pattern is kept identical to
// DOMAIN_CARD_CLASS/DOMAIN_ICON for consistency).
export const DOMAIN_TINT_CLASS: Record<Domain, string> = {
  memory: 'tint-memory',
  attention: 'tint-attention',
  routine: 'tint-routine',
  pattern: 'tint-pattern',
  orientation: 'tint-orientation',
};
