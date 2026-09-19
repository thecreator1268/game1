import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { ForgotPinReset } from '@/components/ForgotPinReset';
import { PinPad } from '@/components/PinPad';
import { db } from '@/db/schema';
import { hashPin } from '@/lib/pin';
import { useAdminAuthStore } from '@/store/adminAuthStore';

export default function AdminLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAdminAuthStore((s) => s.login);
  const [resetOpen, setResetOpen] = useState(false);

  async function verify(pin: string): Promise<boolean> {
    const caregivers = await db.caregivers.toArray();
    for (const c of caregivers) {
      if (c.role !== 'admin') continue;
      const hash = await hashPin(pin, c.pinSalt);
      if (hash === c.pinHash) {
        login(c.id);
        navigate('/admin');
        return true;
      }
    }
    return false;
  }

  // Resets every existing admin's PIN. If none is marked role:'admin' but a
  // caregiver record exists anyway (the device was set up before that field
  // existed, or it was lost some other way), promotes the first caregiver
  // to admin instead of leaving the door permanently shut — this app's own
  // model is "whoever onboarded this device is the admin," so recovering
  // that role for the one caregiver who's here to reset it is the same
  // rule, just applied a second time. Only returns false when there is no
  // caregiver at all (no onboarding has ever happened on this device).
  async function resetPin(pinHash: string, pinSalt: string): Promise<boolean> {
    const caregivers = await db.caregivers.toArray();
    if (caregivers.length === 0) return false;
    const admins = caregivers.filter((c) => c.role === 'admin');
    const target = admins.length > 0 ? admins : [caregivers[0]];
    await Promise.all(
      target.map((c) => db.caregivers.update(c.id, { pinHash, pinSalt, role: 'admin' })),
    );
    login(target[0].id);
    navigate('/admin');
    return true;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-4">
      <Card className="w-full max-w-sm text-center">
        <h1 className="text-heading font-bold">{t('adminAuth.title')}</h1>
        <p className="mt-2 text-body text-text-muted">{t('adminAuth.enterPin')}</p>
        <PinPad
          onSubmit={verify}
          hideError={resetOpen}
          wrongMessage={t('adminAuth.wrongPin')}
          lockedMessage={(seconds) => t('caregiverAuth.tooManyAttempts', { seconds })}
        />
        <ForgotPinReset onReset={resetPin} onOpenChange={setResetOpen} />
      </Card>
    </div>
  );
}
