import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { PinPad } from '@/components/PinPad';
import { db } from '@/db/schema';
import { hashPin } from '@/lib/pin';
import { useAdminAuthStore } from '@/store/adminAuthStore';

export default function AdminLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAdminAuthStore((s) => s.login);

  async function verify(pin: string): Promise<boolean> {
    const hash = await hashPin(pin);
    const caregivers = await db.caregivers.toArray();
    const match = caregivers.find((c) => c.role === 'admin' && c.pinHash === hash);
    if (!match) return false;
    login(match.id);
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
          wrongMessage={t('adminAuth.wrongPin')}
          lockedMessage={(seconds) => t('caregiverAuth.tooManyAttempts', { seconds })}
        />
      </Card>
    </div>
  );
}
