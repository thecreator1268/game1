import { useTranslation } from 'react-i18next';
import { BridgeIcon } from '@/components/icons';

// Shown for exactly as long as the app is genuinely working (Dexie's first
// read, or the instant before onboarding takes over) — never padded with an
// artificial delay, which would only cost returning users time for no
// reason. See RoleSelect.tsx for where this replaces a blank frame.
export function SplashScreen() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-primary px-4 text-center">
      <div className="splash-badge flex h-24 w-24 items-center justify-center rounded-full bg-surface shadow-card">
        <BridgeIcon width={44} height={44} className="text-primary" />
      </div>
      <div>
        <h1 className="text-heading-lg font-bold text-primary-text">{t('common.appName')}</h1>
        <p className="mt-1 text-action text-primary-text">{t('splash.tagline')}</p>
      </div>
    </div>
  );
}
