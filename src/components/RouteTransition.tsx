import { AnimatePresence, motion, type Transition } from 'motion/react';
import type { ReactNode } from 'react';
import { useNavigationType } from 'react-router-dom';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const DISTANCE = 14;
const EASE_SETTLE: Transition['ease'] = [0.16, 1, 0.3, 1];

interface RouteTransitionProps {
  children: ReactNode;
  /** Group key for this subtree — see routeGroup() in App.tsx. Only changes
   *  at "screen" boundaries, so navigating within a nested layout (e.g.
   *  between caregiver tabs) doesn't retrigger an ancestor's transition;
   *  each layout owns its own RouteTransition around its own Outlet. */
  routeKey: string;
  /** 'plain': the app-wide baseline (220ms cross-fade + 14px directional
   *  slide) — used everywhere, including Patient Mode. 'dynamic': the
   *  caregiver/admin-only upgrade (subtle scale+fade) — never used for
   *  patient-facing navigation. */
  variant?: 'plain' | 'dynamic';
}

// Directional, exit-animated screen transitions. AnimatePresence is what
// makes the *exit* half possible at all (see index.css's old .screen-enter
// comment: doing this in pure CSS would mean no exit animation, since
// unmounting is instant without something to delay it) — this is the one
// thing in the whole motion pass raw CSS genuinely couldn't do.
export function RouteTransition({ children, routeKey, variant = 'plain' }: RouteTransitionProps) {
  const navigationType = useNavigationType();
  const prefersReducedMotion = usePrefersReducedMotion();
  // POP covers both browser back/forward and an in-app navigate(-1) — the
  // only signal React Router gives us for "this was a back navigation."
  const direction = navigationType === 'POP' ? -1 : 1;

  if (prefersReducedMotion) return <>{children}</>;

  const transition: Transition =
    variant === 'dynamic'
      ? { duration: 0.26, ease: EASE_SETTLE }
      : { duration: 0.22, ease: 'easeOut' };

  const initial = variant === 'dynamic' ? { opacity: 0, scale: 0.98 } : { opacity: 0, x: direction * DISTANCE };
  const animate = variant === 'dynamic' ? { opacity: 1, scale: 1 } : { opacity: 1, x: 0 };
  const exit = variant === 'dynamic' ? { opacity: 0, scale: 1.01 } : { opacity: 0, x: direction * -DISTANCE };

  return (
    // popLayout: the *exiting* screen is taken out of document flow
    // automatically (Motion applies position: absolute to it only), so the
    // entering screen sits in normal flow immediately and never collides
    // with a sticky nav bar or anything else below it during the ~220ms
    // both are briefly mounted together.
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div key={routeKey} initial={initial} animate={animate} exit={exit} transition={transition}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
