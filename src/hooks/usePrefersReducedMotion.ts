import { useState } from 'react';

// Shared by every Motion-driven component added in the 2026 motion-system
// pass, so "should this skip its animation" is answered the same way
// everywhere rather than each component re-deriving it. Lazy initializer
// keeps the impure matchMedia() read out of the render body itself (same
// pattern as useCountUp/PatientHome's entrance flag) for oxlint's
// react(purity) rule.
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  return prefersReducedMotion;
}
