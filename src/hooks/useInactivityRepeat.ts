import { useEffect, useRef } from 'react';
import { isSpeaking } from '@/lib/speech';

// Re-offers a voice instruction after a stretch with no input, instead of
// leaving it as a one-shot the patient has to remember to ask for. The
// scoping review of ADRD mHealth usability (Engelsma et al. 2021, see
// src/lib/evidence.ts) lists "repeating instructions multiple times" among its
// evidence-based design suggestions; people with dementia often need an
// instruction re-presented, not just available.
//
// Deliberately gentle, not a nag and not a timer that ends anything:
//   - it only ever *offers again* — nothing fails, expires or advances;
//   - any tap/key anywhere resets the window (never interrupts active play);
//   - it never fires while speech is already playing or the tab is hidden;
//   - after MAX_AUTO_REPEATS unanswered offers it stops until the patient
//     interacts again, so a tablet left alone doesn't talk forever.
// The speaker button stays available at all times, so this is additive.

/** Idle time before the instruction is offered again (within the 20–25 s range). */
export const INACTIVITY_REPEAT_MS = 22_000;
/** Unanswered automatic repeats per idle stretch before staying quiet. */
export const MAX_AUTO_REPEATS = 3;

// Input that counts as "the patient is engaged". Pointer/touch/key only —
// no timers or focus changes, which happen without the patient doing anything.
const ACTIVITY_EVENTS = ['pointerdown', 'touchstart', 'keydown'] as const;

interface InactivityRepeatOptions {
  enabled?: boolean;
  idleMs?: number;
  maxRepeats?: number;
}

export function useInactivityRepeat(
  onRepeat: () => void,
  { enabled = true, idleMs = INACTIVITY_REPEAT_MS, maxRepeats = MAX_AUTO_REPEATS }: InactivityRepeatOptions = {},
): void {
  // Latest callback without restarting the idle window every time the
  // caller re-renders (the window must measure *patient* inactivity only).
  const callback = useRef(onRepeat);
  useEffect(() => {
    callback.current = onRepeat;
  });

  useEffect(() => {
    if (!enabled) return undefined;

    let timer: number | undefined;
    let repeats = 0;

    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(fire, idleMs);
    };

    function fire() {
      // Never talk over speech that's already playing or into a hidden tab;
      // just look again after another idle window.
      if (document.visibilityState !== 'visible' || isSpeaking()) {
        schedule();
        return;
      }
      callback.current();
      repeats += 1;
      if (repeats < maxRepeats) schedule();
    }

    const onActivity = () => {
      repeats = 0;
      schedule();
    };

    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, onActivity, { capture: true, passive: true });
    }
    schedule();

    return () => {
      window.clearTimeout(timer);
      for (const event of ACTIVITY_EVENTS) {
        document.removeEventListener(event, onActivity, { capture: true });
      }
    };
  }, [enabled, idleMs, maxRepeats]);
}
