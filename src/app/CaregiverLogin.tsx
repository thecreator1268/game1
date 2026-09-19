import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { ForgotPinReset } from '@/components/ForgotPinReset';
import { PinPad } from '@/components/PinPad';
import { db } from '@/db/schema';
import { hashPin } from '@/lib/pin';
import { useAuthStore } from '@/store/authStore';

export default function CaregiverLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [resetOpen, setResetOpen] = useState(false);

  async function verify(pin: string): Promise<boolean> {
    const caregivers = await db.caregivers.toArray();
    for (const c of caregivers) {
      const hash = await hashPin(pin, c.pinSalt);
      if (hash === c.pinHash) {
        login(c.id);
        navigate('/caregiver');
        return true;
      }
    }
    return false;
  }

  // Resets every caregiver on this device to the same new PIN — this app
  // has no per-caregiver recovery factor (no email/phone), and a device
  // typically has exactly one caregiver anyway (see Onboarding.tsx). Returns
  // false when there's no caregiver at all on this device, so
  // ForgotPinReset can say so instead of silently doing nothing.
  async function resetPin(pinHash: string, pinSalt: string): Promise<boolean> {
    const caregivers = await db.caregivers.toArray();
    if (caregivers.length === 0) return false;
    await Promise.all(caregivers.map((c) => db.caregivers.update(c.id, { pinHash, pinSalt })));
    login(caregivers[0].id);
    navigate('/caregiver');
    return true;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-4">
      <Card className="w-full max-w-sm text-center">
        <h1 className="text-heading font-bold">{t('caregiverAuth.title')}</h1>
        <p className="mt-2 text-body text-text-muted">{t('caregiverAuth.enterPin')}</p>
        <PinPad
          onSubmit={verify}
          hideError={resetOpen}
          wrongMessage={t('caregiverAuth.wrongPin')}
          lockedMessage={(seconds) => t('caregiverAuth.tooManyAttempts', { seconds })}
        />
        <ForgotPinReset onReset={resetPin} onOpenChange={setResetOpen} />
      </Card>
    </div>
  );
}
