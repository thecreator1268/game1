import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

// Ticks 0 -> value over `durationMs` on an ease-out curve, once, the first
// time `value` resolves to a real number (a caregiver stat that starts as
// `undefined` while its live query loads). Defaults to 1 rather than 0 so a
// real figure never flashes as a literal "0" before the count starts — it
// only resets to 0 the instant the animation begins.
//
// GSAP tweens a plain proxy object; only the rounded integer goes into React
// state, so this stays a render-per-integer-step, same as before. gsap is
// only imported here, and this hook is only used by the lazy caregiver
// dashboard chunk, so it never lands in the eager patient-mode bundle.
export function useCountUp(value: number | undefined, durationMs = 950): number {
  // Read once via a lazy initializer (the sanctioned one-time-impure-read
  // pattern elsewhere in this app, e.g. PatientHome's entrance-animation
  // flag) rather than in the body of a render or effect.
  const [prefersReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [display, setDisplay] = useState(1);
  const started = useRef(false);

  useEffect(() => {
    if (value === undefined || started.current || prefersReducedMotion) return undefined;
    started.current = true;

    setDisplay(0);
    const counter = { n: 0 };
    let finished = false;
    const tween = gsap.to(counter, {
      n: value,
      duration: durationMs / 1000,
      ease: 'power3.out',
      onUpdate: () => setDisplay(Math.round(counter.n)),
      onComplete: () => {
        finished = true;
      },
    });
    return () => {
      tween.kill();
      // An interrupted run (StrictMode's dev remount, or `value` changing
      // mid-count) must be allowed to start again; only a finished one is
      // "played once" and stays put.
      if (!finished) started.current = false;
    };
  }, [value, durationMs, prefersReducedMotion]);

  // Reduced motion: skip the animation and just derive the final number
  // directly, rather than mirroring `value` into state via an effect.
  if (prefersReducedMotion) return value ?? 1;
  return display;
}
