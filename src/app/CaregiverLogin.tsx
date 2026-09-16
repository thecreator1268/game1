import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { db } from '@/db/schema';
import { hashPin } from '@/lib/pin';
import { useAuthStore } from '@/store/authStore';

const PIN_LENGTH = 4;
const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export default function CaregiverLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  async function submit(nextPin: string) {
    const hash = await hashPin(nextPin);
    const caregivers = await db.caregivers.toArray();
    const match = caregivers.find((c) => c.pinHash === hash);
    if (match) {
      login(match.id);
      navigate('/caregiver');
    } else {
      setError(true);
      setPin('');
    }
  }

  function press(key: string) {
    setError(false);
    if (key === '⌫') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (!key) return;
    const next = (pin + key).slice(0, PIN_LENGTH);
    setPin(next);
    if (next.length === PIN_LENGTH) void submit(next);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-4">
      <Card className="w-full max-w-sm text-center">
        <h1 className="text-heading font-bold">{t('caregiverAuth.title')}</h1>
        <p className="mt-2 text-body text-text-muted">{t('caregiverAuth.enterPin')}</p>

        <div className="my-6 flex justify-center gap-3">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <span
              key={i}
              className={`h-4 w-4 rounded-full border-2 border-primary ${i < pin.length ? 'bg-primary' : 'bg-transparent'}`}
            />
          ))}
        </div>

        {error && <p className="mb-4 text-body text-danger">{t('caregiverAuth.wrongPin')}</p>}

        <div className="grid grid-cols-3 gap-3">
          {KEYPAD.map((key, idx) =>
            key ? (
              <button
                key={idx}
                onClick={() => press(key)}
                className="tap-target rounded-card border-2 border-border bg-surface text-action font-semibold hover:bg-surface-alt"
              >
                {key}
              </button>
            ) : (
              <span key={idx} />
            ),
          )}
        </div>
      </Card>
    </div>
  );
}
