import { useTranslation } from 'react-i18next';
import { useCaregiverPatient, useCaregiverPatients } from '@/hooks/useCaregiverPatient';
import { useAuthStore } from '@/store/authStore';

// Only relevant for a caregiver linked to more than one patient (e.g. a
// family managing several elders on one shared account) — invisible for the
// common single-patient case.
export function CaregiverPatientSwitcher() {
  const { t } = useTranslation();
  const patients = useCaregiverPatients();
  const activePatient = useCaregiverPatient();
  const setViewPatientId = useAuthStore((s) => s.setViewPatientId);

  if (!patients || patients.length < 2) return null;

  return (
    <div
      className="border-b border-border bg-surface-alt px-4 py-3 print:hidden sm:px-6"
      aria-label={t('dashboard.switchPatient')}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-text-muted">{t('dashboard.switchPatient')}:</span>
        {patients.map((p) => (
          <button
            key={p.id}
            onClick={() => setViewPatientId(p.id)}
            className={`tap-target rounded-full px-4 text-sm font-semibold ${
              activePatient?.id === p.id ? 'bg-primary text-primary-text' : 'bg-surface text-text'
            }`}
            aria-pressed={activePatient?.id === p.id}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
