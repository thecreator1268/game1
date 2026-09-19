import { useEffect, useRef, useState } from 'react';
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedText, setScannedText] = useState('');

  // Same reasoning as FamilyManager's reset: an in-progress draft (or a
  // scanned label) must not silently get attributed to a different patient
  // after a switch via CaregiverPatientSwitcher. Reset during render (see
  // CaregiverHome's identical pattern) rather than in an effect.
  const [lastPatientId, setLastPatientId] = useState(patient?.id);
  if (patient?.id !== lastPatientId) {
    setLastPatientId(patient?.id);
    setCategory('medicine');
    setLabel('');
    setSchedule('08:00');
    setNotes('');
    setScanError(null);
    setScannedText('');
  }

  // Tracks the *current* patient (unlike lastPatientId, which only updates
  // on a change) so an in-flight scan can tell, after its await resolves,
  // whether the caregiver switched patients while it was running —
  // scanning a label takes seconds, plenty of time to tap the patient
  // switcher, and applying a stale result would attribute one patient's
  // medicine label to another patient's reminder. Synced in an effect
  // (after commit), never written during render.
  const currentPatientIdRef = useRef(patient?.id);
  useEffect(() => {
    currentPatientIdRef.current = patient?.id;
  }, [patient?.id]);

  async function handleLabelPhoto(file: File) {
    const scanPatientId = patient?.id;
    setScanning(true);
    setScanProgress(0);
    setScanError(null);
    setScannedText('');
    try {
      // Dynamically imported so the ~100KB tesseract.js glue code (the
      // wasm engine and language data are separate self-hosted files, see
      // src/lib/ocr.ts) is never downloaded just for opening Reminders —
      // only when a caregiver actually taps "Scan Medicine Label".
      const { recognizeMedicineLabel } = await import('@/lib/ocr');
      const text = await recognizeMedicineLabel(file, setScanProgress);
      if (currentPatientIdRef.current !== scanPatientId) return;
      setScannedText(text);
      const firstLine = text.split('\n').map((l) => l.trim()).find((l) => l.length > 0);
      if (firstLine) setLabel(firstLine);
    } catch {
      if (currentPatientIdRef.current === scanPatientId) setScanError(t('reminders.scanFailed'));
    } finally {
      if (currentPatientIdRef.current === scanPatientId) setScanning(false);
    }
  }

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
          {category === 'medicine' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) void handleLabelPhoto(file);
                }}
              />
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={scanning}
              >
                {scanning
                  ? t('reminders.scanning', { percent: Math.round(scanProgress * 100) })
                  : t('reminders.scanLabel')}
              </Button>
              {scanError && <p className="mt-2 text-sm text-danger">{scanError}</p>}
              {!scanning && scannedText && (
                <p className="mt-2 text-sm text-text-muted">
                  {t('reminders.scannedText')}: {scannedText.replace(/\n+/g, ' ').slice(0, 200)}
                </p>
              )}
            </div>
          )}
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
