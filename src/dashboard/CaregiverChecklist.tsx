import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { db } from '@/db/schema';
import { useAuthStore } from '@/store/authStore';

// First-login "Getting started" card for the caregiver: four things worth
// knowing, text only (this audience reads quickly, so no pictures). Kept to
// four short points, each doing one job, in line with showing limited
// information at a time (Engelsma et al. 2021, src/lib/evidence.ts). It stays
// until the caregiver dismisses it or follows one of its links, then never
// returns on its own.
const ITEMS = [
  { key: 'reminders', to: '/caregiver/reminders' },
  { key: 'family', to: '/caregiver/family' },
  { key: 'privacy', to: '/caregiver/settings' },
  { key: 'engineLog', to: null },
] as const;

export function CaregiverChecklist() {
  const { t } = useTranslation();
  const caregiverId = useAuthStore((s) => s.caregiverId);
  const caregiver = useLiveQuery(() => (caregiverId ? db.caregivers.get(caregiverId) : undefined), [caregiverId]);

  // Not loaded yet, unknown caregiver, or already seen: render nothing.
  if (!caregiver || caregiver.checklistSeenAt !== undefined) return null;

  const markSeen = () => void db.caregivers.update(caregiver.id, { checklistSeenAt: Date.now() });

  return (
    <Card className="print:hidden">
      <h2 className="text-action font-bold">{t('checklist.title')}</h2>
      <p className="mt-1 text-body text-text-muted">{t('checklist.intro')}</p>
      <ul className="mt-3 flex flex-col gap-3">
        {ITEMS.map((item) => (
          <li key={item.key} className="text-body">
            {item.to ? (
              <Link to={item.to} onClick={markSeen} className="tap-target inline-flex items-center font-semibold underline">
                {t(`checklist.${item.key}Title`)}
              </Link>
            ) : (
              <span className="font-semibold">{t(`checklist.${item.key}Title`)}</span>
            )}
            <span className="block text-text-muted">{t(`checklist.${item.key}Body`)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Button onClick={markSeen}>{t('checklist.gotIt')}</Button>
      </div>
    </Card>
  );
}
