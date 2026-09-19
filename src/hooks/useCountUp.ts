import { useEffect, useRef, useState } from 'react';

// Ticks 0 -> value over `durationMs` on an ease-out-cubic curve, once, the
// first time `value` resolves to a real number (a caregiver stat that
// starts as `undefined` while its live query loads). Defaults to 1 rather
// than 0 so a real figure never flashes as a literal "0" before the count
// starts — it only resets to 0 the instant the animation begins.
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
    const start = performance.now();
    let raf = 0;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * (value ?? 0)));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs, prefersReducedMotion]);

  // Reduced motion: skip the animation and just derive the final number
  // directly, rather than mirroring `value` into state via an effect.
  if (prefersReducedMotion) return value ?? 1;
  return display;
}
