import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/Button';
import { db } from '@/db/schema';
import { usePatientStore } from '@/store/patientStore';

export default function RoleSelect() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setActivePatient = usePatientStore((s) => s.setActivePatient);
  const patients = useLiveQuery(() => db.patients.toArray(), [], undefined);

  useEffect(() => {
    if (patients && patients.length === 0) {
      navigate('/onboarding', { replace: true });
    }
  }, [patients, navigate]);

  if (!patients || patients.length === 0) return null;

  const primaryPatient = patients[0];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-bg px-4 text-center">
      <h1 className="text-heading-lg font-bold text-primary">{t('common.appName')}</h1>
      <p className="text-action">{t('roles.choosePrompt')}</p>
      <div className="flex w-full max-w-sm flex-col gap-4">
        <Button
          className="w-full"
          onClick={() => {
            setActivePatient(primaryPatient.id);
            navigate('/patient');
          }}
        >
          {t('roles.patient')}
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => navigate('/caregiver/login')}>
          {t('roles.caregiver')}
        </Button>
      </div>
    </div>
  );
}
