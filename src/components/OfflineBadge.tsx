import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSyncStore, isEffectivelyOnline } from '@/store/syncStore';
import { countPendingSync } from '@/sync/queue';
import { CheckIcon, WifiOffIcon, WifiOnIcon } from './icons';

// This badge is the app's single best 3-second proof of the offline-first
// claim in a demo: a pulsing dot while sync is queued, a checkmark once it
// lands. Plain CSS (.sync-pulse in index.css), not Framer Motion — this
// component renders on the patient's very first paint (PatientHome) and
// the caregiver's on every screen (CaregiverLayout), both part of the
// eager main bundle, so pulling in an animation library here would bloat
// exactly the bundle this project's low-RAM-tablet target most needs lean.
export function OfflineBadge() {
  const { t } = useTranslation();
  const isSyncing = useSyncStore((s) => s.isSyncing);
  const simulateOffline = useSyncStore((s) => s.simulateOffline);
  const pending = useLiveQuery(() => countPendingSync(), [], 0);
  const online = isEffectivelyOnline();

  const queued = online && (isSyncing || (pending && pending > 0));

  let label: string;
  if (!online) {
    label = t('common.offline');
  } else if (isSyncing) {
    label = t('common.syncing');
  } else if (pending && pending > 0) {
    label = t('common.pendingSync', { count: pending });
  } else {
    label = t('common.synced');
  }

  const iconToneClass = online ? 'text-success' : 'text-text-muted';

  return (
    <div className="pill-flat" data-testid="offline-badge" aria-live="polite">
      <span className={iconToneClass} aria-hidden>
        {online ? <WifiOnIcon width={18} height={18} /> : <WifiOffIcon width={18} height={18} />}
      </span>
      {simulateOffline && (
        <span className="sr-only">{t('dashboard.airplaneMode')}</span>
      )}
      {queued ? (
        <span className="sync-pulse h-2 w-2 rounded-full bg-accent" aria-hidden />
      ) : online ? (
        <span className="sync-check text-success" aria-hidden>
          <CheckIcon width={16} height={16} />
        </span>
      ) : null}
      <span>{label}</span>
    </div>
  );
}
