import { useState } from 'react';

/**
 * Factory for a per-screen "did this already play?" flag, so a staggered
 * list/grid entrance (fade-up, `.stagger-tile`) plays once per browser tab,
 * not on every re-render (a live query update) or on revisiting an
 * already-seen screen. Call `createEntranceFlag()` once at module scope (not
 * inside the component) to get a dedicated hook bound to its own flag —
 * PatientHome's `hasPlayedHomeEntrance` predates this and keeps its own
 * inline copy of the same pattern rather than being churned for its own sake
 * (2026 exhaustive motion pass: every OTHER card/list entrance in the app now
 * uses this instead of re-deriving the pattern per screen).
 */
export function createEntranceFlag() {
  let played = false;
  return function useEntranceOnce(): boolean {
    const [isFirst] = useState(() => {
      const first = !played;
      played = true;
      return first;
    });
    return isFirst;
  };
}
