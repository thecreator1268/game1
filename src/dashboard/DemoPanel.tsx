import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { OfflineBadge } from '@/components/OfflineBadge';
import { countPendingSync, syncPendingData } from '@/sync/queue';
import { getMockServerReceivedCount } from '@/sync/mockServer';
import { useSyncStore } from '@/store/syncStore';

// The offline→online demo judges can drive live: toggle "airplane mode" to
// force the app into offline behavior, play/mark something elsewhere so it
// queues locally, then toggle back and watch the sync badge flip and a mock
// request actually fire.
export function DemoPanel() {
  const { t } = useTranslation();
  const simulateOffline = useSyncStore((s) => s.simulateOffline);
  const setSimulateOffline = useSyncStore((s) => s.setSimulateOffline);
  const isSyncing = useSyncStore((s) => s.isSyncing);
  const pending = useLiveQuery(() => countPendingSync(), [], 0);
  const [serverReceived, setServerReceived] = useState(getMockServerReceivedCount());

  async function forceSync() {
    await syncPendingData();
    setServerReceived(getMockServerReceivedCount());
  }

  return (
    <Card>
      <h2 className="text-action font-bold">{t('dashboard.demoPanel')}</h2>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-body">{t('dashboard.airplaneMode')}</span>
        <button
          role="switch"
          aria-checked={simulateOffline}
          onClick={() => setSimulateOffline(!simulateOffline)}
          className={`tap-press tap-target rounded-full px-6 font-semibold ${
            simulateOffline ? 'bg-accent text-accent-text' : 'bg-surface-alt text-text border-2 border-border'
          }`}
        >
          {simulateOffline ? t('common.offline').toUpperCase() : t('common.online').toUpperCase()}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <OfflineBadge />
        <span className="text-body text-text-muted">
          {t('common.pendingSync', { count: pending ?? 0 })}
        </span>
      </div>

      <Button
        className="mt-4"
        onClick={() => void forceSync()}
        disabled={simulateOffline || isSyncing}
      >
        {t('dashboard.forceSyncNow')}
      </Button>

      <p className="mt-3 text-sm text-text-muted">Mock server has received {serverReceived} records total.</p>
    </Card>
  );
}
