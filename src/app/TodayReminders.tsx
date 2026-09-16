import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { CheckIcon } from '@/components/icons';
import { getTodaysReminders, markReminderTaken } from '@/reminders/reminderService';

const CATEGORY_EMOJI: Record<string, string> = {
  medicine: '💊',
  hydration: '💧',
  activity: '🏃',
  appointment: '🩺',
};

export function TodayReminders({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const reminders = useLiveQuery(() => getTodaysReminders(patientId), [patientId], []);

  if (!reminders || reminders.length === 0) {
    return (
      <Card>
        <h2 className="text-action font-bold">{t('reminders.title')}</h2>
        <p className="mt-2 text-body text-text-muted">{t('reminders.noneToday')}</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-action font-bold">{t('reminders.title')}</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {reminders.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface-alt p-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden>
                {CATEGORY_EMOJI[r.category] ?? '⏰'}
              </span>
              <div>
                <p className="text-body font-semibold">{r.label}</p>
                <p className="text-sm text-text-muted">{r.schedule}</p>
              </div>
            </div>
            {r.takenToday ? (
              <span className="flex items-center gap-2 font-semibold text-success">
                <CheckIcon width={22} height={22} />
                {t('reminders.taken')}
              </span>
            ) : (
              <Button variant="accent" onClick={() => void markReminderTaken(r)}>
                {t('reminders.markTaken')}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
