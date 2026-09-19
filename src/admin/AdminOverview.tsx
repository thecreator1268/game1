import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/IconSprite';
import { db } from '@/db/schema';
import type { SupportedLanguage } from '@/db/types';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { countPendingSync } from '@/sync/queue';
import { newId } from '@/lib/id';
import { generatePinSalt, hashPin } from '@/lib/pin';
import { usePatientStore } from '@/store/patientStore';
import { useAdminAuthStore } from '@/store/adminAuthStore';

function randomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const RESET_CONFIRM_WORD = 'DELETE';

export default function AdminOverview() {
  const { t } = useTranslation();
  const adminId = useAdminAuthStore((s) => s.adminId);
  const activePatientId = usePatientStore((s) => s.activePatientId);
  const setActivePatient = usePatientStore((s) => s.setActivePatient);

  const patients = useLiveQuery(() => db.patients.toArray(), [], []);
  const caregivers = useLiveQuery(() => db.caregivers.toArray(), [], []);
  const sessionCount = useLiveQuery(() => db.sessions.count(), [], 0);
  const pendingSync = useLiveQuery(() => countPendingSync(), [], 0);
  const sessionCountsByPatient = useLiveQuery(async () => {
    const sessions = await db.sessions.toArray();
    const counts = new Map<string, number>();
    for (const s of sessions) counts.set(s.patientId, (counts.get(s.patientId) ?? 0) + 1);
    return counts;
  }, [], new Map<string, number>());

  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientLang, setNewPatientLang] = useState<SupportedLanguage>('en');
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [revealedPin, setRevealedPin] = useState<{ caregiverId: string; pin: string } | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [exporting, setExporting] = useState(false);

  async function addPatient() {
    if (!newPatientName.trim() || !adminId) return;
    const patientId = newId();
    await db.patients.add({
      id: patientId,
      name: newPatientName.trim(),
      preferredLanguage: newPatientLang,
      caregiverIds: [adminId],
      highContrastPalette: 'theme-1',
      textScale: 'normal',
      colorMode: 'light',
      // Added by an already-authenticated admin to a device whose consent
      // notice was already accepted during the original onboarding.
      consentGivenAt: Date.now(),
      reminderAlertsEnabled: false,
      createdAt: Date.now(),
    });
    const admin = await db.caregivers.get(adminId);
    if (admin) {
      await db.caregivers.update(adminId, { patientIds: [...admin.patientIds, patientId] });
    }
    setNewPatientName('');
    setShowAddPatient(false);
  }

  async function resetCaregiverPin(caregiverId: string) {
    const pin = randomPin();
    const pinSalt = generatePinSalt();
    const pinHash = await hashPin(pin, pinSalt);
    await db.caregivers.update(caregiverId, { pinHash, pinSalt });
    setRevealedPin({ caregiverId, pin });
  }

  async function exportAllData() {
    setExporting(true);
    try {
      const [allPatients, allCaregivers, allSessions, allLevelChanges, allReminders, allReminderLogs, allFamily] =
        await Promise.all([
          db.patients.toArray(),
          db.caregivers.toArray(),
          db.sessions.toArray(),
          db.levelChanges.toArray(),
          db.reminders.toArray(),
          db.reminderLogs.toArray(),
          db.familyMembers.toArray(),
        ]);
      const payload = {
        exportedAt: new Date().toISOString(),
        patients: allPatients,
        // Caregiver PIN hashes are salted SHA-256 but are still left out of
        // the export — a backup file is not the place for auth material.
        caregivers: allCaregivers.map(({ pinHash: _pinHash, pinSalt: _pinSalt, ...rest }) => rest),
        sessions: allSessions,
        levelChanges: allLevelChanges,
        reminders: allReminders,
        reminderLogs: allReminderLogs,
        familyMembers: allFamily,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smriti-setu-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function resetAllData() {
    if (confirmText !== RESET_CONFIRM_WORD) return;
    await db.transaction(
      'rw',
      [db.patients, db.caregivers, db.sessions, db.levelChanges, db.reminders, db.reminderLogs, db.familyMembers],
      async () => {
        await Promise.all([
          db.patients.clear(),
          db.caregivers.clear(),
          db.sessions.clear(),
          db.levelChanges.clear(),
          db.reminders.clear(),
          db.reminderLogs.clear(),
          db.familyMembers.clear(),
        ]);
      },
    );
    setActivePatient(null);
    window.localStorage.clear();
    window.location.href = import.meta.env.BASE_URL;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-heading-lg font-bold">{t('adminAuth.panelTitle')}</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-sm text-text-muted">{t('adminPanel.totalPatients')}</p>
          <p className="text-heading font-bold">{patients?.length ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-muted">{t('adminPanel.totalCaregivers')}</p>
          <p className="text-heading font-bold">{caregivers?.length ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-muted">{t('adminPanel.totalSessions')}</p>
          <p className="text-heading font-bold">{sessionCount ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-muted">{t('common.pendingSync', { count: pendingSync ?? 0 })}</p>
          <p className="text-heading font-bold">{pendingSync ?? 0}</p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-action font-bold">{t('adminPanel.patients')}</h2>
          <Button variant="secondary" onClick={() => setShowAddPatient((v) => !v)}>
            {t('adminPanel.addPatient')}
          </Button>
        </div>

        {showAddPatient && (
          <div className="mt-4 flex flex-wrap items-end gap-3 rounded-card border-2 border-border p-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-text-muted">{t('onboarding.setupPatientName')}</label>
              <input
                autoFocus
                value={newPatientName}
                onChange={(e) => setNewPatientName(e.target.value)}
                placeholder={t('onboarding.setupPatientNamePlaceholder')}
                className="tap-target rounded-card border-2 border-border bg-surface px-3"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-text-muted">{t('dashboard.language')}</label>
              <select
                value={newPatientLang}
                onChange={(e) => setNewPatientLang(e.target.value as SupportedLanguage)}
                className="tap-target rounded-card border-2 border-border bg-surface px-3"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={() => void addPatient()} disabled={!newPatientName.trim()}>
              {t('common.add')}
            </Button>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {(patients ?? []).map((p) => (
            <Card key={p.id} className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-text-muted">
                  {SUPPORTED_LANGUAGES.find((l) => l.code === p.preferredLanguage)?.label ?? p.preferredLanguage}
                  {' · '}
                  {t('common.score')}: {sessionCountsByPatient?.get(p.id) ?? 0}
                </p>
              </div>
              {activePatientId === p.id ? (
                <span className="rounded-full bg-surface-alt px-3 py-1 text-sm font-semibold text-primary">
                  {t('adminPanel.activePatient')}
                </span>
              ) : (
                <Button variant="secondary" onClick={() => setActivePatient(p.id)}>
                  {t('adminPanel.setActive')}
                </Button>
              )}
            </Card>
          ))}
          {(patients ?? []).length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-card border-2 border-dashed border-border p-8 text-center">
              <span className="icon-chip bg-surface-alt" aria-hidden>
                <Icon name="family" size={22} />
              </span>
              <p className="text-body text-text-muted">{t('adminPanel.noPatients')}</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-action font-bold">{t('adminPanel.caregivers')}</h2>
        <div className="mt-4 flex flex-col gap-3">
          {(caregivers ?? []).map((c) => (
            <Card key={c.id} className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm capitalize text-text-muted">
                  {c.relation} · {c.role} · {t('adminPanel.patients')}: {c.patientIds.length}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {revealedPin?.caregiverId === c.id && (
                  <span className="rounded-full bg-surface-alt px-3 py-1 text-sm font-bold text-primary">
                    {t('adminPanel.newPin')}: {revealedPin.pin}
                  </span>
                )}
                <Button variant="secondary" onClick={() => void resetCaregiverPin(c.id)}>
                  {t('adminPanel.resetPin')}
                </Button>
              </div>
            </Card>
          ))}
          {(caregivers ?? []).length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-card border-2 border-dashed border-border p-8 text-center">
              <span className="icon-chip bg-surface-alt" aria-hidden>
                <Icon name="person" size={22} />
              </span>
              <p className="text-body text-text-muted">{t('adminPanel.noCaregivers')}</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-action font-bold">{t('adminPanel.languages')}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <div key={lang.code} className="flex items-center justify-between rounded-card border-2 border-border px-3 py-2">
              <span className="font-semibold">{lang.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  lang.complete ? 'bg-surface-alt text-success' : 'bg-surface-alt text-text-muted'
                }`}
              >
                {lang.complete ? t('adminPanel.complete') : t('adminPanel.beta')}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-action font-bold">{t('adminPanel.dataTools')}</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => void exportAllData()} disabled={exporting}>
            {t('adminPanel.exportAllData')}
          </Button>
        </div>

        <div className="mt-6 rounded-card border-2 border-danger p-4">
          <h3 className="font-bold text-danger">{t('adminPanel.dangerZone')}</h3>
          <p className="mt-1 text-sm text-text-muted">{t('adminPanel.resetAllDataBody', { word: RESET_CONFIRM_WORD })}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={RESET_CONFIRM_WORD}
              className="tap-target rounded-card border-2 border-border bg-surface px-3"
            />
            <Button
              variant="accent"
              onClick={() => void resetAllData()}
              disabled={confirmText !== RESET_CONFIRM_WORD}
              className="!bg-danger !text-danger-text"
            >
              {t('adminPanel.resetAllData')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
