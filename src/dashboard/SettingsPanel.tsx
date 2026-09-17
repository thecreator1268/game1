import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { db } from '@/db/schema';
import type { SupportedLanguage } from '@/db/types';
import { useCaregiverPatient } from '@/hooks/useCaregiverPatient';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { isNotificationSupported, requestNotificationPermission } from '@/reminders/notificationService';

export default function SettingsPanel() {
  const { t } = useTranslation();
  const patient = useCaregiverPatient();
  const [permissionDenied, setPermissionDenied] = useState(false);

  if (!patient) return null;

  async function enableReminderAlerts() {
    if (!patient) return;
    const result = await requestNotificationPermission();
    if (result === 'granted') {
      setPermissionDenied(false);
      await db.patients.update(patient.id, { reminderAlertsEnabled: true });
    } else {
      setPermissionDenied(true);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-heading-lg font-bold">{t('dashboard.settings')}</h1>

      <Card>
        <h2 className="text-action font-bold">{t('dashboard.language')}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => void db.patients.update(patient.id, { preferredLanguage: lang.code as SupportedLanguage })}
              className={`tap-target rounded-card border-2 px-4 font-semibold ${
                patient.preferredLanguage === lang.code
                  ? 'border-primary bg-primary text-primary-text'
                  : 'border-border bg-surface'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-action font-bold">{t('dashboard.extraLargeText')}</h2>
        <div className="mt-4 flex gap-3">
          {(['normal', 'large', 'xl'] as const).map((scale) => (
            <button
              key={scale}
              onClick={() => void db.patients.update(patient.id, { textScale: scale })}
              className={`tap-target flex-1 rounded-card border-2 font-semibold ${
                patient.textScale === scale ? 'border-primary bg-primary text-primary-text' : 'border-border bg-surface'
              }`}
            >
              {scale === 'normal' ? 'A' : scale === 'large' ? 'A+' : 'A++'}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-action font-bold">{t('dashboard.highContrastPalette')}</h2>
        <div className="mt-4 flex gap-3">
          {(['theme-1', 'theme-2'] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => void db.patients.update(patient.id, { highContrastPalette: theme })}
              className={`tap-target flex-1 rounded-card border-2 font-semibold ${
                patient.highContrastPalette === theme
                  ? 'border-primary bg-primary text-primary-text'
                  : 'border-border bg-surface'
              }`}
            >
              {theme === 'theme-1' ? 'Theme 1' : 'Theme 2'}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-text-muted">
          Theme 2 substitutes blue/amber for red/green, for common colour-vision changes.
        </p>
      </Card>

      <Card>
        <h2 className="text-action font-bold">{t('dashboard.reminderAlerts')}</h2>
        <p className="mt-1 text-sm text-text-muted">{t('dashboard.reminderAlertsBody')}</p>
        {!isNotificationSupported() ? (
          <p className="mt-3 text-sm text-danger">{t('dashboard.reminderAlertsUnsupported')}</p>
        ) : patient.reminderAlertsEnabled ? (
          <p className="mt-3 text-body font-semibold text-success">{t('dashboard.reminderAlertsOn')}</p>
        ) : (
          <div className="mt-3">
            <Button onClick={() => void enableReminderAlerts()}>{t('dashboard.reminderAlertsEnable')}</Button>
            {permissionDenied && (
              <p className="mt-2 text-sm text-danger">{t('dashboard.reminderAlertsDenied')}</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
