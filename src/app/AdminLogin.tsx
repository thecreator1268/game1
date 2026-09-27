import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/Card';
import { ForgotPinReset } from '@/components/ForgotPinReset';
import { PinPad } from '@/components/PinPad';
import { db } from '@/db/schema';
import { generatePinSalt, hashPin } from '@/lib/pin';
import { useAdminAuthStore } from '@/store/adminAuthStore';

// Setup-flow stages for a device whose admin caregiver record has no
// adminPinHash yet (see db/types.ts's Caregiver comment) — covers both
// already-onboarded data from before this field existed, and the brief
// window during a fresh onboarding before Onboarding.tsx's own admin-PIN
// step runs. 'verifyCaregiver' proves it's the caregiver (the same trust
// level the old shared-PIN behavior already granted), then 'chooseAdminPin'
// / 'confirmAdminPin' capture a PIN that must differ from the caregiver's.
type SetupStage = 'verifyCaregiver' | 'chooseAdminPin' | 'confirmAdminPin';

export default function AdminLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAdminAuthStore((s) => s.login);
  const [resetOpen, setResetOpen] = useState(false);
  const [setupStage, setSetupStage] = useState<SetupStage>('verifyCaregiver');
  const [setupCaregiverId, setSetupCaregiverId] = useState<string | null>(null);
  const [setupCaregiverPin, setSetupCaregiverPin] = useState('');
  const [setupAdminPinCandidate, setSetupAdminPinCandidate] = useState('');

  const needsSetup = useLiveQuery(async () => {
    const caregivers = await db.caregivers.toArray();
    const admins = caregivers.filter((c) => c.role === 'admin');
    if (admins.length === 0) return false; // no onboarding yet; nothing to gate
    return admins.every((c) => !c.adminPinHash);
  }, [], undefined);

  async function verify(pin: string): Promise<boolean> {
    const caregivers = await db.caregivers.toArray();
    for (const c of caregivers) {
      if (c.role !== 'admin' || !c.adminPinHash || !c.adminPinSalt) continue;
      const hash = await hashPin(pin, c.adminPinSalt);
      if (hash === c.adminPinHash) {
        login(c.id);
        navigate('/admin');
        return true;
      }
    }
    return false;
  }

  // Stage 1: prove identity the same way the app always has — the
  // caregiver PIN — before letting this device set up its first, separate
  // admin PIN.
  async function verifyCaregiverForSetup(pin: string): Promise<boolean> {
    const caregivers = await db.caregivers.toArray();
    for (const c of caregivers) {
      if (c.role !== 'admin') continue;
      const hash = await hashPin(pin, c.pinSalt);
      if (hash === c.pinHash) {
        setSetupCaregiverId(c.id);
        setSetupCaregiverPin(pin);
        setSetupStage('chooseAdminPin');
        return true;
      }
    }
    return false;
  }

  // Stage 2: capture the candidate admin PIN, rejecting it inline (via
  // PinPad's own wrong-PIN message) if it matches the caregiver PIN just
  // entered — the exact mistake this whole flow exists to prevent.
  async function chooseAdminPin(pin: string): Promise<boolean> {
    if (pin === setupCaregiverPin) return false;
    setSetupAdminPinCandidate(pin);
    setSetupStage('confirmAdminPin');
    return true;
  }

  // Stage 3: confirm, then persist the new admin credential and log in.
  async function confirmAdminPin(pin: string): Promise<boolean> {
    if (pin !== setupAdminPinCandidate || !setupCaregiverId) return false;
    const adminPinSalt = generatePinSalt();
    const adminPinHash = await hashPin(pin, adminPinSalt);
    await db.caregivers.update(setupCaregiverId, { adminPinHash, adminPinSalt });
    login(setupCaregiverId);
    navigate('/admin');
    return true;
  }

  // Resets every existing admin's PIN (the admin PIN specifically — the
  // caregiver PIN is untouched, see CaregiverLogin.tsx's own reset). If
  // none is marked role:'admin' but a caregiver record exists anyway (the
  // device was set up before that field existed), promotes the first
  // caregiver to admin instead of leaving the door permanently shut. Only
  // returns false when there is no caregiver at all on this device.
  async function resetPin(pinHash: string, pinSalt: string): Promise<boolean> {
    const caregivers = await db.caregivers.toArray();
    if (caregivers.length === 0) return false;
    const admins = caregivers.filter((c) => c.role === 'admin');
    const target = admins.length > 0 ? admins : [caregivers[0]];
    await Promise.all(
      target.map((c) =>
        db.caregivers.update(c.id, { adminPinHash: pinHash, adminPinSalt: pinSalt, role: 'admin' }),
      ),
    );
    login(target[0].id);
    navigate('/admin');
    return true;
  }

  if (needsSetup === undefined) return null;

  if (needsSetup) {
    const stageCopy: Record<SetupStage, { body: string; onSubmit: (pin: string) => Promise<boolean>; wrongMessage: string }> = {
      verifyCaregiver: {
        body: t('adminAuth.setupVerifyBody'),
        onSubmit: verifyCaregiverForSetup,
        wrongMessage: t('caregiverAuth.wrongPin'),
      },
      chooseAdminPin: {
        body: t('adminAuth.setupChooseBody'),
        onSubmit: chooseAdminPin,
        wrongMessage: t('adminAuth.setupChooseSameAsCaregiver'),
      },
      confirmAdminPin: {
        body: t('adminAuth.setupConfirmBody'),
        onSubmit: confirmAdminPin,
        wrongMessage: t('adminAuth.wrongPin'),
      },
    };
    const stage = stageCopy[setupStage];
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-4">
        <Card className="w-full max-w-sm text-center">
          <h1 className="text-heading font-bold">{t('adminAuth.setupTitle')}</h1>
          <p className="mt-2 text-body text-text-muted">{stage.body}</p>
          <PinPad
            key={setupStage}
            onSubmit={stage.onSubmit}
            wrongMessage={stage.wrongMessage}
            lockedMessage={(seconds) => t('caregiverAuth.tooManyAttempts', { seconds })}
          />
        </Card>
      </div>
    );
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
