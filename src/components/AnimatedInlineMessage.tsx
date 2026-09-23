import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { EASE_STANDARD, MOTION_MEDIUM_MS } from '@/lib/motionTokens';

interface AnimatedInlineMessageProps {
  /**
   * Presence key: null/empty hides the message; any other value shows it.
   * Give each new occurrence a distinct value (e.g. the thing that was just
   * added) so back-to-back messages replay the fade+rise instead of the
   * second one silently reusing the first's already-settled state.
   */
  presenceKey: string | null;
  className: string;
  children: ReactNode;
}

// Shared entrance/exit signature for every inline success/error line in the
// app — before this pass, FamilyManager's "member added", RemindersManager's
// "reminder added" and PinPad's wrong/locked message were each a bare,
// unanimated <p> built at a different time, with no shared implementation.
// This doesn't force a shared markup shape (an icon, exact spacing) since
// those three genuinely differ — only the timing/easing/direction, which is
// what "consistent motion signature" actually means here.
export function AnimatedInlineMessage({ presenceKey, className, children }: AnimatedInlineMessageProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  return (
    <AnimatePresence mode="wait">
      {presenceKey && (
        <motion.p
          key={presenceKey}
          role="status"
          className={className}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: prefersReducedMotion ? 0 : MOTION_MEDIUM_MS / 1000, ease: EASE_STANDARD }}
        >
          {children}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
