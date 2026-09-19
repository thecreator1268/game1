---
name: motion-system
description: SmritiSetu's app-wide motion/animation spec — Tier 1 baseline (press feedback, screen transitions, entrance staggers, sync/level-up/loading states) and Tier 2 elevated motion reserved for specific caregiver-only/celebratory spots. Load this before building or changing any screen, component, or interaction that involves animation, transitions, or loading states — not for engine/data-model/test work.
---

# SmritiSetu — motion system

Two tiers. Tier 1 is the baseline every screen gets. Tier 2 is a more
elaborate layer used **only** in the specific, deliberately scoped places
listed below — do not apply Tier 2 techniques anywhere else.

Implemented via the `motion` package (`motion/react`) for anything
JS-orchestrated (route transitions, springs, staggered/particle effects),
plus a handful of plain CSS keyframes in `src/index.css` for simple,
always-mounted, eager-bundle-sensitive pieces (`OfflineBadge`'s sync pulse,
the skeleton shimmer) — see those files' own comments for why each picked
its lane. One shared implementation per behavior, reused everywhere, not
scattered/reinvented per component.

Every animation must respect `prefers-reduced-motion` (see
`src/hooks/usePrefersReducedMotion.ts`) and must be skippable — never gate
a patient's next tap on an animation finishing.

## TIER 1 — baseline motion, applies app-wide

1. **Card/tile/button press feedback** — every tappable element (game
   cards, reminder rows, nav icons, pill buttons): on press, scale to 0.96
   over 100-120ms, spring back on release. One shared CSS class (`.tap-press`
   in `src/index.css`, or the equivalent inline `active:scale-[0.96]` on
   `IconButton`) reused everywhere, not per-component.

2. **Screen transitions** — 220ms cross-fade + 14px slide. Forward
   navigation slides from the right, back navigation slides from the left,
   consistently, everywhere. Implemented in `src/components/RouteTransition.tsx`
   (Motion `AnimatePresence`, direction from `useNavigationType()`), wrapping
   the top-level `<Routes>` in `App.tsx` (grouped by `routeGroup()` so
   navigating *within* a nested layout doesn't retrigger it) plus a second,
   nested instance around `CaregiverLayout`/`AdminLayout`'s own `<Outlet/>`
   for their internal tab navigation.

3. **"Today's Set" cards on load** — fade + slide up, staggered ~40ms
   between each card, once on mount only — not on every re-render. (Existing
   CSS `.stagger-tile` + `PatientHome`'s `hasPlayedHomeEntrance` module flag;
   left as-is during the 2026 motion pass since it already satisfied this
   exactly and converting a already-correct simple entrance to Motion for
   its own sake wasn't worth the churn.)

4. **Reminder "Mark" → "Taken" transition** — animate the change over
   ~200-250ms rather than an instant swap (`TodayReminders`'s `ssStamp`
   pop-in on the Taken pill). The compact "All N done" summary text
   fades+scales in when it changes (`TodayReminders`, Motion
   `AnimatePresence` keyed by `allDone`) — this is deliberately the *text*,
   not an illustrated banner: an earlier explicit fix request removed the
   redundant banner and kept only this compact line as the one "all done"
   element, so don't reintroduce a banner here.

5. **Caregiver dashboard domain bars (base)** — bar height grows from 0 on
   first load, ease-out, staggered per bar. Upgraded straight to the Tier-2
   version below (spring overshoot) since this exact chart is also the
   Tier-2 caregiver-dashboard item — there's no separate plainer version to
   maintain alongside it.

6. **Sync badge (base)** — pulsing opacity while "queued" (`.sync-pulse`),
   morphing to a checkmark with a scale-in bounce when it flips to "Synced"
   (`.sync-check`) — `src/components/OfflineBadge.tsx` / `index.css`.

7. **Level-up moment (base)** — badge pop-in (scale 0.8→1.05→1, ~900ms
   total), auto-dismiss (~1.4s), interruptible by the next tap. Only for
   `LevelDecision.direction === 'up'` — a difficulty *decrease* is a
   supportive adjustment, not a win, and renders as plain text instead (see
   `SessionSummary.tsx`). Implemented in `src/components/LevelUpBadge.tsx`.

8. **Loading states** — skeleton shimmer (`src/components/Skeleton.tsx`,
   `.skeleton` in `index.css`) while a lazy dashboard/admin chunk loads,
   replacing the old bare "Loading…" text — no blank flash between screens.

## TIER 2 — elevated motion, ONLY in these specific places

1. **Caregiver dashboard on load** (`CaregiverHome.tsx` /
   `DomainBalanceChart.tsx`): domain bars grow with a slight
   overshoot-and-settle spring (Motion `motion.rect` custom Recharts `shape`,
   `type: 'spring'`, staggered ~60ms per bar — replaces Recharts' own
   built-in bar animation, which can't do a per-bar stagger), the weekly
   summary text types on character-by-character at ~15ms/char
   (`useTypewriter` hook), stat numbers count up from 0 over ~900ms
   (`useCountUp` hook — used for the adherence streak and the Garden card's
   "steady weeks"). Adult caregiver audience — more motion here is a
   feature, not a risk.

2. **Level-up celebration** (`LevelUpBadge.tsx`, used from
   `SessionSummary.tsx` for `direction === 'up'` only): 8-12 small
   palette-colored particle chips arc outward and fade around the badge
   while it spring-overshoots into place. Total under 1.5s, still fully
   skippable — every button below it stays clickable throughout regardless
   of whether the celebration has finished.

3. **App launch / splash moment** (`SplashScreen.tsx`): one-time animated
   logo line-draw (Motion `pathLength`, ~1s) + wordmark fade-up. Gated by a
   module-level "already played this tab" flag (`hasPlayedSplashReveal`,
   same pattern as `PatientHome`'s `hasPlayedHomeEntrance`) — **this guard
   is load-bearing, not decorative**: `RoleSelect` renders `SplashScreen`
   for the brief moment its own patients query is still loading, not only
   for a genuine first-ever install, so without the flag the reveal could
   replay on ordinary navigation back to "/".

4. **Sync badge upgrade** (`OfflineBadge.tsx` / `.sync-check::after` in
   `index.css`): a ring radiates outward from the badge alongside the
   checkmark morph. Kept in plain CSS rather than Motion, deliberately —
   `OfflineBadge` renders on every patient's very first paint as part of the
   eager main bundle, and a decorative one-shot ring doesn't need JS
   orchestration to justify pulling Motion in for this specific component
   (Motion is already unavoidably in the eager bundle now because of #2
   above applying to Patient Mode too, but this ring stays CSS on
   principle/precedent, not because it has to).

5. **Caregiver-mode screen transitions**: the nested `RouteTransition`
   around `CaregiverLayout`/`AdminLayout`'s `<Outlet/>` uses
   `variant="dynamic"` (subtle scale+fade) instead of Patient Mode's plain
   directional slide — this audience isn't the accessibility-constrained
   one.

## Explicitly do NOT apply Tier 2 to:
- Patient Mode navigation or game input screens (`RouteTransition`'s
  `variant="plain"` — the default — is what every patient-facing route
  uses; `variant="dynamic"` is caregiver/admin-only).
- Anything before or during a game round — in-game feedback stays exactly
  as Tier 1/the existing spec: soft glow for correct, gentle amber shake
  for incorrect (`RoundFeedback.tsx`), no upgrade here.
- Anything that could delay a patient's next tap beyond the existing
  skippable timing already defined.

`SessionSummary`'s level-up celebration is a judgment call worth flagging
explicitly: it's patient-facing (a patient plays the game and sees their
own summary), but it happens *after* a completed round, not before/during
one, and it's a celebration screen, not navigation or game input — so it
was treated as in-scope for the Tier-2 upgrade rather than excluded by the
above list. Revisit this reading if it turns out to be the wrong call.

## Showcase mode

`src/app/ShowcaseMode.tsx`, route `/showcase` — not linked from any nav.
Plays the splash reveal, the caregiver dashboard entrance, and a level-up
celebration back-to-back once per "Play showcase" press, purely so a demo
recording doesn't need a real seeded account. Never auto-plays and never
loops.

## Constraints (apply to both tiers, non-negotiable)
- Nothing loops forever or plays automatically on a timer.
- Every animation is skippable by the next tap — never force a wait.
- Respect `prefers-reduced-motion` (`usePrefersReducedMotion` hook) —
  every new Motion-driven component added in this pass checks it and skips
  straight to the final state when it's set.
- Use `motion/react` for anything JS-orchestrated, not raw CSS keyframes
  scattered per-component — see the OfflineBadge/skeleton exception above
  for when plain CSS is still the right call (always-eager, purely
  decorative, no orchestration needed) and say so explicitly in a comment
  when you make that call, the way `OfflineBadge.tsx` and `index.css`'s
  `.sync-check::after` comment do.
