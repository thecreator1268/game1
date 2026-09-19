---
name: accessibility-checklist
description: Elderly-dementia-patient accessibility rules for SmritiSetu — tap target sizes, no failing timers, no competitive/gamification patterns, contrast, and the no-emoji icon rule. Load this before building or reviewing any Patient Mode or Caregiver Mode screen, component, or interaction — not for backend/engine/data-model work.
---

# SmritiSetu accessibility checklist

Source of truth: `CLAUDE_CODE_BUILD_PROMPT.md`'s "Elderly-first accessibility"
section and its "Indopendence" design system section's adaptation notes.
Quoted verbatim below — if this file and `CLAUDE_CODE_BUILD_PROMPT.md` ever
disagree, the build prompt wins and this file is stale.

## Elderly-first accessibility (hard requirement, not polish)

- Minimum body font size **18px**, primary actions **22-24px**, with a
  caregiver-toggleable "extra large" mode going up to 28px.
- Minimum tap target **64x64px**, spaced at least 16px apart. This applies
  **at every breakpoint** — phone, small tablet, and large tablet/laptop.
  Tap targets never shrink below 64px just because a mouse is more precise
  than a finger; only spacing, columns, and font sizes scale with
  breakpoint.
- High-contrast theme by default (WCAG AAA where feasible — 7:1 contrast
  for text); provide a caregiver toggle for a second high-contrast palette
  for common colour-vision changes in elderly users.
- **No swipe gestures, no double-tap, no drag-and-drop with a timeout, no
  auto-advancing carousels.** Use single large taps everywhere except the
  two deliberate exceptions (Dinacharya Sequence and Naksha Jodo, both
  drag-based), and for those make drag forgiving (large drop zones, no time
  pressure, undo always available).
- **No hard timers that fail the patient** — use gentle pacing indicators,
  never a countdown that ends the game.
- One task/screen at a time; no nested menus deeper than 2 levels; a
  single, always-visible "home" button.
- Session length nudges: after ~10-12 minutes (roughly 3-4 games), show a
  friendly "take a break?" prompt — cognitive fatigue in dementia patients
  is real and should be designed for, not treated as an engagement metric
  to maximize.

## Patterns explicitly banned in Patient Mode

(From the Indopendence design system's "this is an adaptation, not a copy"
notes — these are patterns the visual reference itself uses that must NOT
be carried over.)

- ❌ **No live chat/comment threads** under questions or anywhere else —
  confusing and potentially distressing for a dementia patient; SmritiSetu
  has no multiplayer social layer.
- ❌ **No competitive leaderboard against strangers** ("Global Rank," other
  players' scores) — use the private, personal domain-balance view instead.
- ❌ **No countdown timer pressure** — every timer is a calm, untimed "take
  your time" indicator instead.
- ❌ **No in-app currency/coins** — irrelevant and potentially confusing;
  the streak indicator covers that role instead.

## Icons

**Custom SVG line icons only, never emoji.** Emoji render inconsistently
across devices/OSes and read as an unstyled placeholder, not a designed
icon. One icon style throughout: 24x24 viewBox, ~1.9px stroke, rounded
caps/joins, `stroke: currentColor`. See `src/components/IconSprite.tsx` for
the shared sprite — reuse an existing symbol before drawing a new one.

## Trust & compliance surface (caregiver mode)

- Real Privacy Policy screen, Terms of Use, data export & delete
  (caregiver-facing), no dark patterns — delete must be as easy to find as
  "add" or "start game," never buried.
- Persistent, non-intrusive footer/clinical-note line: this app supports
  cognitive engagement and monitoring, not diagnosis.

## Verification

Prefer a check you can actually run over eyeballing:
- Grep new/changed UI files for emoji unicode ranges (U+1F300–U+1FAFF,
  U+2600–U+27BF) — should be zero matches outside game-content item pools.
- Check any new tap target's rendered size at the phone breakpoint (<600px)
  specifically — that's where 64px violations are easiest to introduce.
- If a screen adds any timer, countdown, or auto-advancing element, that's
  a stop-and-ask moment, not a build-and-ship one.
