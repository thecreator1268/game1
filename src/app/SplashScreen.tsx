import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

// Shown for exactly as long as the app is genuinely working (Dexie's first
// read, or the instant before onboarding takes over) — never padded with an
// artificial delay, which would only cost returning users time for no
// reason. See RoleSelect.tsx for where this replaces a blank frame.
//
// RoleSelect also renders this for the split second its own patients query
// is still loading (not only the true "zero patients ever" case), and
// navigating back to "/" from elsewhere in the app remounts RoleSelect —
// so without a guard, the line-draw reveal below could replay on ordinary
// navigation, not just a genuine cold launch. Module-level flag (same
// pattern as PatientHome's hasPlayedHomeEntrance) makes it play once per
// tab lifetime and render statically every time after.
let hasPlayedSplashReveal = false;

interface SplashScreenProps {
  /** Showcase mode only — replays the reveal regardless of whether it's
   *  already played this tab, since a recording needs it every time. */
  forceReveal?: boolean;
  /** Showcase mode only — fired once the reveal sequence has fully played,
   *  so a scripted demo sequence knows when to cut to the next beat. Never
   *  called at all when the reveal is skipped (already played, or reduced
   *  motion), since there's nothing to wait for in that case. */
  onRevealDone?: () => void;
}

export function SplashScreen({ forceReveal = false, onRevealDone }: SplashScreenProps = {}) {
  const { t } = useTranslation();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [playReveal] = useState(() => {
    const isFirstThisSession = !hasPlayedSplashReveal;
    hasPlayedSplashReveal = true;
    return (isFirstThisSession || forceReveal) && !prefersReducedMotion;
  });

  // Total reveal timeline: 3 paths x (0.18s stagger + 0.45s draw) finishing
  // around 0.99s, then the wordmark's own 0.4s fade starting at 0.55s ends
  // around 0.95s — ~1s overall, matching the spec's "~1s" reveal.
  useEffect(() => {
    if (!playReveal || !onRevealDone) return undefined;
    const timer = setTimeout(onRevealDone, 1000);
    return () => clearTimeout(timer);
  }, [playReveal, onRevealDone]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-primary px-4 text-center">
      <div className="splash-badge flex h-24 w-24 items-center justify-center rounded-full bg-surface shadow-card">
        <motion.svg
          width={44}
          height={44}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
          initial={playReveal ? 'hidden' : undefined}
          animate="visible"
        >
          {['M3 17c1.8-5.3 5-8.5 9-8.5s7.2 3.2 9 8.5', 'M2 17h20', 'M6.5 17v3.5M17.5 17v3.5'].map((d, i) => (
            <motion.path
              key={d}
              d={d}
              variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: i * 0.18 }}
            />
          ))}
        </motion.svg>
      </div>
      <motion.div
        initial={playReveal ? { opacity: 0, y: 10 } : undefined}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: playReveal ? 0.55 : 0 }}
      >
        <h1 className="text-heading-lg font-bold text-primary-text">{t('common.appName')}</h1>
        <p className="mt-1 text-action text-primary-text">{t('splash.tagline')}</p>
      </motion.div>
    </div>
  );
}
