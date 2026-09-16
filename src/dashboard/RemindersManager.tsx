import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { db } from '@/db/schema';
import type { ReminderCategory } from '@/db/types';
import { useCaregiverPatient } from '@/hooks/useCaregiverPatient';
import { addReminder, deleteReminder } from '@/reminders/reminderService';

const CATEGORIES: ReminderCategory[] = ['medicine', 'hydration', 'activity', 'appointment'];

export default function RemindersManager() {
  const { t } = useTranslation();
  const patient = useCaregiverPatient();
  const reminders = useLiveQuery(
    () => (patient ? db.reminders.where('patientId').equals(patient.id).toArray() : []),
    [patient?.id],
    [],
  );

  const [category, setCategory] = useState<ReminderCategory>('medicine');
  const [label, setLabel] = useState('');
  const [schedule, setSchedule] = useState('08:00');
  const [notes, setNotes] = useState('');

  async function handleAdd() {
    if (!patient || !label.trim()) return;
    await addReminder({ patientId: patient.id, category, label: label.trim(), schedule, notes: notes.trim() || undefined });
    setLabel('');
    setNotes('');
  }

  if (!patient) return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-heading-lg font-bold">{t('reminders.manageTitle')}</h1>

      <Card>
        <h2 className="text-action font-bold">{t('reminders.addReminder')}</h2>
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  category === c ? 'bg-primary text-primary-text' : 'bg-surface-alt text-text'
                }`}
              >
                {t(`reminders.${c}`)}
              </button>
            ))}
          </div>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t('reminders.label')}
            className="tap-target rounded-card border-2 border-border bg-surface px-4 text-body"
          />
          <label className="text-sm text-text-muted">{t('reminders.schedule')}</label>
          <input
            type={category === 'appointment' ? 'datetime-local' : 'time'}
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            className="tap-target rounded-card border-2 border-border bg-surface px-4 text-body"
          />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('reminders.notes')}
            className="tap-target rounded-card border-2 border-border bg-surface px-4 text-body"
          />
          <Button onClick={() => void handleAdd()} disabled={!label.trim()}>
            {t('common.add')}
          </Button>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        {reminders && reminders.length > 0 ? (
          reminders.map((r) => (
            <Card key={r.id} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-body font-semibold">
                  {t(`reminders.${r.category}`)} — {r.label}
                </p>
                <p className="text-sm text-text-muted">{r.schedule}</p>
                {r.notes && <p className="text-sm text-text-muted">{r.notes}</p>}
              </div>
              <button onClick={() => void deleteReminder(r.id)} className="text-sm font-semibold text-danger">
                {t('common.delete')}
              </button>
            </Card>
          ))
        ) : (
          <p className="text-body text-text-muted">{t('reminders.noneToday')}</p>
        )}
      </div>
    </div>
  );
}
