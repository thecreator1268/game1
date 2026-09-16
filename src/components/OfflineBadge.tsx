import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSyncStore, isEffectivelyOnline } from '@/store/syncStore';
import { countPendingSync } from '@/sync/queue';
import { WifiOffIcon, WifiOnIcon } from './icons';

export function OfflineBadge() {
  const { t } = useTranslation();
  const isSyncing = useSyncStore((s) => s.isSyncing);
  const simulateOffline = useSyncStore((s) => s.simulateOffline);
  const pending = useLiveQuery(() => countPendingSync(), [], 0);
  const online = isEffectivelyOnline();

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

  const toneClass = online
    ? 'bg-success text-success-text'
    : 'bg-surface-alt text-text border border-border';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${toneClass}`}
      data-testid="offline-badge"
      aria-live="polite"
    >
      {online ? <WifiOnIcon width={18} height={18} /> : <WifiOffIcon width={18} height={18} />}
      {simulateOffline && (
        <span className="sr-only">{t('dashboard.airplaneMode')}</span>
      )}
      <span>{label}</span>
    </div>
  );
}
