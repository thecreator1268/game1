import { useEffect, useState } from 'react';
import { Icon } from './IconSprite';

const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

// Kept outside the component so the impure Date.now() read is never textually
// inside a component/hook body — that's what React Compiler's purity check
// (via oxlint) actually flags, even though this only ever runs from a click
// handler, never during render.
function lockoutExpiry(): number {
  return Date.now() + LOCKOUT_SECONDS * 1000;
}

interface PinPadProps {
  length?: number;
  wrongMessage: string;
  lockedMessage: (secondsLeft: number) => string;
  /** Resolve true on a matching PIN (caller handles login + navigation); false on a miss. */
  onSubmit: (pin: string) => Promise<boolean>;
  /** True while the sibling "reset your PIN" panel is open — clears and suppresses the stale miss message. */
  hideError?: boolean;
}

// Shared by CaregiverLogin and AdminLogin: a 4-digit keypad with a lockout
// after repeated misses. This is still a lightweight gate, not a real
// security boundary (see authStore.ts) — the lockout exists to discourage
// idle keypad-mashing, not to resist a determined attacker.
export function PinPad({ length = 4, wrongMessage, lockedMessage, onSubmit, hideError = false }: PinPadProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  if (hideError && error) setError(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setSecondsLeft(0);
      } else {
        setSecondsLeft(remaining);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [lockedUntil]);

  async function submit(nextPin: string) {
    const ok = await onSubmit(nextPin);
    if (ok) return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setError(true);
    setPin('');
    if (nextAttempts >= MAX_ATTEMPTS) {
      setLockedUntil(lockoutExpiry());
    }
  }

  function press(key: string) {
    if (lockedUntil) return;
    setError(false);
    if (key === '⌫') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (!key) return;
    const next = (pin + key).slice(0, length);
    setPin(next);
    if (next.length === length) void submit(next);
  }

  const locked = Boolean(lockedUntil);

  return (
    <>
      <div className="my-6 flex justify-center gap-3">
        {Array.from({ length }).map((_, i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full border-2 border-primary ${i < pin.length ? 'bg-primary' : 'bg-transparent'}`}
          />
        ))}
      </div>

      {locked ? (
        <p className="mb-4 text-body text-danger">{lockedMessage(secondsLeft)}</p>
      ) : (
        error && <p className="mb-4 text-body text-danger">{wrongMessage}</p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {KEYPAD.map((key, idx) =>
          key ? (
            <button
              key={idx}
              onClick={() => press(key)}
              disabled={locked}
              aria-label={key === '⌫' ? 'Backspace' : undefined}
              className="tap-press tap-target shadow-card flex items-center justify-center rounded-card bg-surface text-action font-semibold hover:bg-surface-alt disabled:opacity-40"
            >
              {key === '⌫' ? <Icon name="backspace" size={28} /> : key}
            </button>
          ) : (
            <span key={idx} />
          ),
        )}
      </div>
    </>
  );
}
