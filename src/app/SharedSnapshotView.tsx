import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/Card';
import { AdherenceChart } from '@/dashboard/AdherenceChart';
import { DomainBalanceChart } from '@/dashboard/DomainBalanceChart';
import { decodeSnapshot, type SharedSnapshot } from '@/dashboard/sharedSnapshot';

// A read-only page for a family member who isn't a registered caregiver on
// this device — opened from a link/QR another caregiver generated (see
// CaregiverHome's "Share with Family"). Deliberately never touches Dexie:
// everything it shows comes only from the signed snapshot embedded in the
// URL, so it can't see (or accidentally mix in) whatever patient data
// already lives on the viewing device.
export default function SharedSnapshotView() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const data = searchParams.get('view');
  const sig = searchParams.get('sig');
  const [decoded, setDecoded] = useState<SharedSnapshot | null | undefined>(undefined);

  useEffect(() => {
    if (!data || !sig) return undefined;
    let cancelled = false;
    void decodeSnapshot(data, sig).then((result) => {
      if (!cancelled) setDecoded(result);
    });
    return () => {
      cancelled = true;
    };
  }, [data, sig]);

  if (!data || !sig) {
    return (
      <div className="min-h-screen bg-bg px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Card>
            <p className="text-body">{t('sharedView.invalid')}</p>
          </Card>
        </div>
      </div>
    );
  }

  const snapshot = decoded;
  if (snapshot === undefined) return null;

  return (
    <div className="min-h-screen bg-bg px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <h1 className="text-heading-lg font-bold text-primary">{t('common.appName')}</h1>

        {snapshot === null ? (
          <Card>
            <p className="text-body">{t('sharedView.invalid')}</p>
          </Card>
        ) : (
          <>
            <Card>
              <p className="text-sm font-semibold text-accent">{t('sharedView.banner')}</p>
              <h2 className="mt-2 text-action font-bold">{snapshot.patientName}</h2>
              <p className="text-sm text-text-muted">{new Date(snapshot.generatedAt).toLocaleString()}</p>
            </Card>

            <Card>
              <h2 className="text-action font-bold">{t('dashboard.weeklySummary')}</h2>
              <p className="mt-2 text-body text-text-muted">{snapshot.weeklySummary || t('dashboard.noData')}</p>
            </Card>

            <Card>
              <h2 className="text-action font-bold">{t('dashboard.domainBalance')}</h2>
              <DomainBalanceChart data={snapshot.domainBalance} />
            </Card>

            <Card>
              <h2 className="text-action font-bold">{t('dashboard.adherence')}</h2>
              <p className="mt-1 text-body text-text-muted">
                {t('dashboard.streak')}: {snapshot.adherenceStreak}
              </p>
              <AdherenceChart data={snapshot.adherenceSeries} />
            </Card>

            <p className="text-sm text-text-muted">{t('dashboard.disclaimer')}</p>
          </>
        )}
      </div>
    </div>
  );
}
