import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { IconButton } from './IconButton';
import { CloseIcon } from './icons';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { EASE_STANDARD, MOTION_MEDIUM_MS } from '@/lib/motionTokens';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ title, onClose, children }: ModalProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // A real dialog, not just a styled div: focus moves in on open, Tab
  // cycles within it rather than escaping to the page behind, Escape
  // closes it, and focus returns to whatever opened it — every keyboard/
  // screen-reader user's baseline expectation for role="dialog".
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const firstFocusable = dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (firstFocusable ?? dialog)?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !dialog) return;
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, []);

  const prefersReducedMotion = usePrefersReducedMotion();
  // Duration-0 rather than branching to two JSX trees (the usual convention
  // elsewhere in the motion pass, e.g. DomainBalanceChart's AnimatedBar):
  // Modal's tree is a real dialog (focus trap, header, arbitrary children),
  // so duplicating it whole just to drop the animation isn't worth the drift
  // risk — motion.div with a 0ms transition renders the exact same final
  // state instantly, which is what "respects prefers-reduced-motion" means
  // here. The caller wraps `{open && <Modal/>}` in `<AnimatePresence>` so
  // this exit animation actually gets to play before unmount (see
  // RouteTransition's comment on why that's unavoidable with Motion).
  const duration = prefersReducedMotion ? 0 : MOTION_MEDIUM_MS / 1000;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration }}
    >
      <motion.div
        ref={dialogRef}
        tabIndex={-1}
        className="card-elderly w-full max-w-lg max-h-[85vh] overflow-y-auto outline-none"
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration, ease: EASE_STANDARD }}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-heading font-bold">{title}</h2>
          <IconButton label={t('common.close')} onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
