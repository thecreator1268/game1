import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

// Reveals `text` one character at a time (~15ms/char) — the caregiver
// dashboard's weekly-summary line specifically (see the 2026 motion-system
// spec's caregiver-dashboard Tier-2 upgrade; adult audience, not the
// accessibility-constrained patient one). Re-runs whenever `text` itself
// changes (a new summary loaded — a different date range, a different
// active patient).
export function useTypewriter(text: string, msPerChar = 15): string {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [shown, setShown] = useState('');
  // Reset synchronously during render when `text` itself changes (same
  // "compare against last-seen prop" idiom CaregiverHome uses for
  // lastPatientId) rather than resetting from inside the effect below —
  // an effect that just mirrors a changed prop into state is exactly the
  // case oxlint's set-state-in-effect rule (and React's own docs) flag.
  const [lastText, setLastText] = useState(text);
  if (text !== lastText) {
    setLastText(text);
    setShown('');
  }

  useEffect(() => {
    if (prefersReducedMotion || !text) return undefined;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, msPerChar);
    return () => window.clearInterval(id);
  }, [text, msPerChar, prefersReducedMotion]);

  // Reduced motion: skip the animation and derive the final string directly
  // during render, same pattern as useCountUp's reduced-motion branch.
  if (prefersReducedMotion) return text;
  return shown;
}
