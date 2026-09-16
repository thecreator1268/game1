import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { db } from '@/db/schema';
import type { SupportedLanguage } from '@/db/types';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { newId } from '@/lib/id';
import { hashPin } from '@/lib/pin';
import { usePatientStore } from '@/store/patientStore';

type Step = 'language' | 'patientName' | 'pin' | 'done';

const PIN_LENGTH = 4;

export default function Onboarding() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const setActivePatient = usePatientStore((s) => s.setActivePatient);

  const [step, setStep] = useState<Step>('language');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [patientName, setPatientName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  function chooseLanguage(code: SupportedLanguage) {
    setLanguage(code);
    void i18n.changeLanguage(code);
    setStep('patientName');
  }

  async function finishSetup() {
    if (pin.length !== PIN_LENGTH || pin !== confirmPin) {
      setPinError(t('caregiverAuth.wrongPin'));
      return;
    }
    const patientId = newId();
    const caregiverId = newId();
    const pinHash = await hashPin(pin);

    await db.patients.add({
      id: patientId,
      name: patientName.trim() || 'Patient',
      preferredLanguage: language,
      caregiverIds: [caregiverId],
      highContrastPalette: 'theme-1',
      textScale: 'normal',
      createdAt: Date.now(),
    });
    await db.caregivers.add({
      id: caregiverId,
      name: 'Caregiver',
      relation: 'Family',
      pinHash,
      patientIds: [patientId],
      createdAt: Date.now(),
    });
    setActivePatient(patientId);
    setStep('done');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-xl">
        {step === 'language' && (
          <Card>
            <h1 className="text-heading-lg font-bold">{t('onboarding.chooseLanguage')}</h1>
            <p className="mt-2 text-body text-text-muted">{t('onboarding.chooseLanguageBody')}</p>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => chooseLanguage(lang.code as SupportedLanguage)}
                  className="tap-target rounded-card border-2 border-border bg-surface p-4 text-action font-semibold hover:bg-surface-alt"
                >
                  {lang.label}
                </button>
              ))}
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
