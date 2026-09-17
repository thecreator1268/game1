import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { PinPad } from '@/components/PinPad';
import { db } from '@/db/schema';
import { hashPin } from '@/lib/pin';
import { useAuthStore } from '@/store/authStore';

export default function CaregiverLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-4">
      <Card className="w-full max-w-sm text-center">
        <h1 className="text-heading font-bold">{t('caregiverAuth.title')}</h1>
        <p className="mt-2 text-body text-text-muted">{t('caregiverAuth.enterPin')}</p>
        <PinPad
          onSubmit={verify}
          wrongMessage={t('caregiverAuth.wrongPin')}
          lockedMessage={(seconds) => t('caregiverAuth.tooManyAttempts', { seconds })}
        />
      </Card>
    </div>
  );
}
