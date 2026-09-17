import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { BridgeIcon } from '@/components/icons';
import { db } from '@/db/schema';
import type { SupportedLanguage } from '@/db/types';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { newId } from '@/lib/id';
import { generatePinSalt, hashPin } from '@/lib/pin';
import { usePatientStore } from '@/store/patientStore';

type Step = 'language' | 'consent' | 'patientName' | 'pin' | 'done';

const PIN_LENGTH = 4;

export default function Onboarding() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const setActivePatient = usePatientStore((s) => s.setActivePatient);

  const [step, setStep] = useState<Step>('language');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [consentGivenAt, setConsentGivenAt] = useState<number | null>(null);
  const [patientName, setPatientName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  function chooseLanguage(code: SupportedLanguage) {
    setLanguage(code);
    void i18n.changeLanguage(code);
    setStep('consent');
  }

  function giveConsent() {
    setConsentGivenAt(Date.now());
    setStep('patientName');
  }

  async function finishSetup() {
    if (pin.length !== PIN_LENGTH || pin !== confirmPin) {
      setPinError(t('caregiverAuth.wrongPin'));
      return;
    }
    const patientId = newId();
    const caregiverId = newId();
    const pinSalt = generatePinSalt();
    const pinHash = await hashPin(pin, pinSalt);

    await db.patients.add({
      id: patientId,
      name: patientName.trim() || 'Patient',
      preferredLanguage: language,
      caregiverIds: [caregiverId],
      highContrastPalette: 'theme-1',
      textScale: 'normal',
      consentGivenAt: consentGivenAt ?? Date.now(),
      reminderAlertsEnabled: false,
      createdAt: Date.now(),
    });
    await db.caregivers.add({
      id: caregiverId,
      name: 'Caregiver',
      relation: 'Family',
      pinHash,
      pinSalt,
      patientIds: [patientId],
      // The caregiver who completes first-time setup on a device owns the
      // Admin Panel for that install (see AdminLogin.tsx) — there is no
      // separate admin-signup step, since it would just be one more thing
      // to configure before the app is usable.
      role: 'admin',
      createdAt: Date.now(),
    });
    setActivePatient(patientId);
    setStep('done');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-xl">
        {step === 'language' && (
          <>
            <div className="mb-8 flex flex-col items-center gap-3 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-card">
                <BridgeIcon width={38} height={38} className="text-primary-text" />
              </div>
              <h1 className="text-heading-lg font-bold text-primary">{t('onboarding.welcome')}</h1>
            </div>
            <Card>
              <h2 className="text-heading font-bold">{t('onboarding.chooseLanguage')}</h2>
              <p className="mt-2 text-body text-text-muted">{t('onboarding.chooseLanguageBody')}</p>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => chooseLanguage(lang.code as SupportedLanguage)}
                    className="tap-target rounded-card border-2 border-border bg-surface p-4 text-action font-semibold shadow-card transition-transform hover:border-primary hover:bg-surface-alt active:scale-[0.97]"
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </Card>
          </>
        )}

        {step === 'consent' && (
          <Card>
            <h1 className="text-heading-lg font-bold">{t('onboarding.consentTitle')}</h1>
            <p className="mt-2 text-body text-text-muted">{t('onboarding.consentBody')}</p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-body text-text-muted">
              <li>{t('onboarding.consentPointStorage')}</li>
              <li>{t('onboarding.consentPointControl')}</li>
              <li>{t('onboarding.consentPointNotDiagnosis')}</li>
            </ul>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
              <Button className="w-full" onClick={giveConsent}>
                {t('onboarding.consentAgree')}
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => navigate('/')}>
                {t('onboarding.consentDecline')}
              </Button>
            </div>
          </Card>
        )}

        {step === 'patientName' && (
          <Card>
            <h1 className="text-heading-lg font-bold">{t('onboarding.setupPatientName')}</h1>
            <input
              autoFocus
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder={t('onboarding.setupPatientNamePlaceholder')}
              className="tap-target mt-6 w-full rounded-card border-2 border-border bg-surface px-4 text-action"
            />
            <Button
              className="mt-6 w-full"
              disabled={!patientName.trim()}
              onClick={() => setStep('pin')}
            >
              {t('common.next')}
            </Button>
          </Card>
        )}

        {step === 'pin' && (
          <Card>
            <h1 className="text-heading-lg font-bold">{t('onboarding.setupCaregiverPin')}</h1>
            <input
              type="password"
              inputMode="numeric"
              maxLength={PIN_LENGTH}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="tap-target mt-6 w-full rounded-card border-2 border-border bg-surface px-4 text-center text-action tracking-[0.5em]"
            />
            <p className="mt-4 text-body text-text-muted">{t('onboarding.setupCaregiverPinConfirm')}</p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={PIN_LENGTH}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="tap-target mt-2 w-full rounded-card border-2 border-border bg-surface px-4 text-center text-action tracking-[0.5em]"
            />
            {pinError && <p className="mt-2 text-body text-danger">{pinError}</p>}
            <Button
              className="mt-6 w-full"
              disabled={pin.length !== PIN_LENGTH || confirmPin.length !== PIN_LENGTH}
              onClick={() => void finishSetup()}
            >
              {t('common.done')}
            </Button>
          </Card>
        )}

        {step === 'done' && (
          <Card className="text-center">
            <h1 className="text-heading-lg font-bold text-primary">{t('onboarding.setupComplete')}</h1>
            <p className="mt-2 text-body text-text-muted">{t('onboarding.setupCompleteBody')}</p>
            <Button className="mt-6 w-full" onClick={() => navigate('/')}>
              {t('onboarding.getStarted')}
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
