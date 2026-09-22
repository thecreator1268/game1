---
name: design-system
description: SmritiSetu's "Indopendence" visual design system — exact color tokens, Unbounded/Space Grotesk fonts, flat-card + speech-bubble-tag + blob-mascot game card pattern, black-pill buttons/nav-dock. Load this before building or restyling any screen, card, button, or chart — not for engine/data-model/test work.
---

# SmritiSetu — "Indopendence" design system

Source of truth: `CLAUDE_CODE_BUILD_PROMPT.md`'s "Animated, polished UI — the
'Indopendence' gaming design system" section, quoted verbatim below. Live
reference mockup (match its look and feel exactly, then extend to every
remaining screen): https://claude.ai/artifact/7M6qJBRsfrPxGVFzBXuPGt

**This is an adaptation, not a copy** — see the accessibility-checklist
skill for the specific patterns from the reference that must NOT be carried
over (timers, leaderboards, chat, coins).

## Token system — exact values

```
Fantasy (background):  #F5F4ED
Light Gold:             #FFDA57   — Memory domain
Smoky Black (ink/UI):   #100F06   — text, primary buttons, bottom dock
Malibu (sky blue):      #7DCAF6   — Attention domain
Bright Lavender:        #A293FF   — Orientation domain
Teal:                   #00917A   — Routine domain, success/correct + primary accent
Blossom Pink:           #FFBBF4   — icon chips / reminder accents
Light Coral:            #F47575   — Pattern domain
```

Live in this repo as CSS custom properties in `src/index.css`
(`--color-*`, `--domain-*`, `--chip-pink`) — read those before hardcoding a
hex value. Two accessibility deviations already made and documented there:
fonts are self-hosted (not Google Fonts CDN — this is an offline-first PWA)
and `theme-2` swaps the Pattern domain hue to amber for CVD separation. Both
are explained in `src/index.css`'s own comments; don't re-litigate them,
extend them if you add new theme-dependent colors.

## Typography

- **Unbounded** (weights 500-800): all headings, card title tags,
  celebratory toasts, section labels.
- **Space Grotesk** (weights 400-700): all body text, buttons, descriptions,
  chips.
- Tailwind classes: `font-heading` (Unbounded) / `font-body` (Space
  Grotesk), or the base `h1`/`h2`/`h3` selectors which already default to
  Unbounded in `src/index.css`.

## Card pattern (every game tile)

- Full flat-color card (one of the domain palette colors,
  `rounded-card` = 26px), **no shadow** — flat and bold, not soft/clay.
  Implemented as `.game-card` + `.game-card-{domain}` in `src/index.css`;
  domain→class mapping lives in `src/dashboard/domainColors.ts`'s
  `DOMAIN_CARD_CLASS` — **use that literal-class-name lookup, never build
  the class via template-string interpolation** (`` `game-card-${domain}` ``
  gets silently tree-shaken out of the production build by Tailwind's
  content scanner — this bit a previous pass, see git history).
- A white "speech-bubble" tag overlapping the top of the card
  (`rounded-tag` = `16px 16px 16px 4px` — the flattened corner is what
  reads as a speech bubble) holding the game's name in Unbounded.
  `.speech-tag` in `src/index.css`.
- A blob-mascot character centered in the card (`.blob-mascot` +
  `.blob-face`/`.blob-eye`/`.blob-blush`/`.blob-mouth`) — one consistent
  style, recolored white-on-card. **Do not mix in a different mascot style
  per screen.** The mascot needs its large top margin (currently
  `mt-[38px]`) to clear the speech tag — both are positioned elements
  painting in DOM order, so insufficient clearance makes the mascot paint
  over the tag's text on any two-line game name.
- Difficulty shown as pip-dots (`.pip` / `.pip-on`, filled = current level
  out of 10), not a number.
- A black pill "Play ▶" button (`.pill-ink`) anchored at the card's bottom
  edge. On the Routine/teal card specifically, invert to light-bg/dark-text
  (teal is dark enough that dark-ink text/pips on it fail contrast) — see
  the `inverted` flag in `PatientHome.tsx`'s `GameCard`.

## Chrome patterns

- Top identity pill: white rounded pill, avatar circle + name, top-left.
- Streak indicator: white rounded pill, flame icon + "N-day," top-right.
- Bottom navigation (caregiver mode only — Patient Mode has nowhere else to
  navigate to, so it keeps its single home-button pattern instead): a
  black pill-shaped dock (`.dock` / `.dock-btn` / `.dock-btn-on`), active
  tab highlighted with a filled Teal circle.
- Reminders and log rows: white rounded rows with a colored icon-chip on
  the left (`.icon-chip`, pink/gold/malibu/coral rotation) and a black pill
  action button on the right. **56px+ row height / icon-chip size** — the
  source reference's list density is tighter than this app's tap-target
  minimum allows.
- Success feedback: a dark pill toast ("Well done! ✨") that scale-fades in
  from the bottom and auto-dismisses (`.toast-in` keyframe,
  `RoundFeedback.tsx`).
- Caregiver domain-balance chart: rounded-top bars with an icon avatar
  floating above each bar (`DomainBalanceChart.tsx`'s `DomainAvatar` label
  renderer) — bars represent the 5 cognitive domains' weekly activity.

## Icons

Custom SVG only (see accessibility-checklist skill) — the full shared
sprite is `src/components/IconSprite.tsx`, reused verbatim from the
reference mockup's `<symbol>` defs. Use `<Icon name="..." />`, don't inline
a new `<svg>` for something the sprite already covers.

## Motion

- Card tap: 120ms scale to 0.96, spring back on release (`.tap-press`).
- Screen change: fade + 14px slide-in on mount (`.screen-enter`) — entrance
  only, no exit animation (would need an animation library; deliberately
  avoided for this low-RAM-tablet target's bundle size).
- Success toast: scale+fade in from `translateY(10px)`, ~300ms, auto-dismiss.
- Domain bars: animate in on first load, staggered.
- Level-up: dark pill + Unbounded text + spark icon
  (`.level-up-badge`, `SessionSummary.tsx`), not a generic modal.

## Self-check before calling a screen done

Put the reference mockup screenshot next to the build's screenshot — same
colors, same two fonts, same card/pill shapes, same mascot style, or it
isn't done. Then separately verify every item in the accessibility-checklist
skill's "banned patterns" list is actually absent.
