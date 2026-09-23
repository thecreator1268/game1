import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { Icon } from './IconSprite';

interface ConfirmDangerModalProps {
  title: string;
  /** What will be lost and that it can't be undone — plain statement, not a euphemism. */
  body: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  /**
   * Highest-friction gate, for the most severe/irreversible actions (wiping
   * all of a patient's data): the caregiver must type this exact word
   * before the confirm button does anything. Omit it for a still-real but
   * smaller loss (removing one family member), which instead needs a
   * second deliberate tap — see `.danger-arm` below.
   */
  typeToConfirm?: string;
}

// Shared shape for every "this cannot be undone" action in the app —
// currently Settings → Privacy & Data's "Delete this patient's data" and
// Family Manager's "Delete" (which also removes that member's photo from
// Naam Yaad). Cancel is the visually primary-looking button and sits first/
// left so it's the path of least resistance; the destructive button uses
// the danger palette and never fires on a single accidental tap.
export function ConfirmDangerModal({
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
  typeToConfirm,
}: ConfirmDangerModalProps) {
  const { t } = useTranslation();
  const [typed, setTyped] = useState('');
  // "Armed" two-tap flow for the non-typed variant: the first tap on the
  // destructive button only arms it (swaps its label to an explicit
  // "tap again" prompt); the second tap actually confirms. Re-arms after a
  // generous pause so a caregiver who taps once, gets distracted, and comes
  // back much later doesn't find a still-primed button — but long enough
  // (15s) that reading the confirmation copy before the second tap is never
  // a race against a hidden clock.
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return undefined;
    const timer = setTimeout(() => setArmed(false), 15000);
    return () => clearTimeout(timer);
  }, [armed]);

  const typedMatches = typeToConfirm ? typed.trim().toUpperCase() === typeToConfirm.toUpperCase() : true;

  function handleConfirmTap() {
    if (typeToConfirm) {
      if (typedMatches) onConfirm();
      return;
    }
    if (armed) {
      onConfirm();
      return;
    }
    setArmed(true);
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-card border-2 border-danger bg-danger/10 p-4">
          <span className="mt-0.5 text-danger" aria-hidden>
            <Icon name="trash" size={24} />
          </span>
          <div className="text-body text-text">{body}</div>
        </div>

        {typeToConfirm && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-text-muted">
              {t('common.typeToConfirm', { word: typeToConfirm })}
            </span>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              className="input-elderly font-semibold tracking-widest"
              aria-label={t('common.typeToConfirm', { word: typeToConfirm })}
            />
          </label>
        )}

        {/* Cancel comes first in DOM order, not just visually — Modal's own
            focus-trap effect focuses the first focusable element on open,
            so this ordering is what actually makes Cancel the keyboard/
            screen-reader default, not only the "looks primary" one. */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={onClose} className="btn-primary">
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirmTap}
            disabled={typeToConfirm ? !typedMatches : false}
            className="btn-elderly shadow-card-sm bg-danger text-danger-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            {!typeToConfirm && armed ? t('common.tapAgainToConfirm') : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
