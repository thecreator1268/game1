import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { generatePinSalt, hashPin } from '@/lib/pin';

const PIN_LENGTH = 4;

interface ForgotPinResetProps {
  /**
   * Persist the new pinHash/pinSalt (caller decides which caregiver
   * record(s) it applies to) and log in. Resolve false — never throw — when
   * there was no matching account to reset, so the caller can show that
   * instead of silently doing nothing.
   */
  onReset: (pinHash: string, pinSalt: string) => Promise<boolean>;
  /** Fires when the panel opens/closes so the sibling PIN pad can drop its stale "wrong PIN" message. */
  onOpenChange?: (open: boolean) => void;
}

// Shown on both CaregiverLogin and AdminLogin. There's no email/phone/
// security-question recovery in this app (see README: PIN auth is a
// lightweight gate, not a security boundary) — a caregiver locked out by a
// forgotten PIN previously had no way back in at all, which is a real gap,
// not an acceptable trade-off of that lightweight-gate design.
export function ForgotPinReset({ onReset, onOpenChange }: ForgotPinResetProps) {
  const { t } = useTranslation();
  const [open, setOpenState] = useState(false);
  function setOpen(next: boolean) {
    setOpenState(next);
    onOpenChange?.(next);
  }
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-4 text-sm font-semibold text-text-muted underline hover:text-text"
      >
        {t('caregiverAuth.forgotPin')}
      </button>
    );
  }

  async function submit() {
    if (pin.length !== PIN_LENGTH || pin !== confirmPin) {
      setError(t('caregiverAuth.forgotPinMismatch'));
      return;
    }
    setBusy(true);
    try {
      const salt = generatePinSalt();
      const hash = await hashPin(pin, salt);
      const ok = await onReset(hash, salt);
      if (!ok) setError(t('caregiverAuth.forgotPinNoAccount'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-card border-2 border-border p-4 text-left">
      <p className="text-sm font-semibold">{t('caregiverAuth.forgotPinTitle')}</p>
      <p className="mt-1 text-sm text-text-muted">{t('caregiverAuth.forgotPinBody')}</p>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={PIN_LENGTH}
        value={pin}
        onChange={(e) => {
          setError('');
          setPin(e.target.value.replace(/\D/g, ''));
        }}
        placeholder="••••"
        className="input-elderly mt-3 w-full text-center text-action tracking-[0.5em]"
      />
      <input
        type="password"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={PIN_LENGTH}
        value={confirmPin}
        onChange={(e) => {
          setError('');
          setConfirmPin(e.target.value.replace(/\D/g, ''));
        }}
        placeholder="••••"
        className="input-elderly mt-2 w-full text-center text-action tracking-[0.5em]"
      />
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)} disabled={busy}>
          {t('common.cancel')}
        </Button>
        <Button
          className="flex-1"
          onClick={() => void submit()}
          disabled={busy || pin.length !== PIN_LENGTH || confirmPin.length !== PIN_LENGTH}
        >
          {t('caregiverAuth.forgotPinSubmit')}
        </Button>
      </div>
    </div>
  );
}
