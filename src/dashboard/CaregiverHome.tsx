import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { db } from '@/db/schema';
import { useCaregiverPatient } from '@/hooks/useCaregiverPatient';
import {
  buildWeeklySummary,
  getAdaptiveLog,
  getAdherence,
  getCognitiveInsights,
  getDomainAveragesForRange,
  getDomainBalance,
  getDomainTrends,
} from './dashboardData';
import { DomainTrendsChart } from './DomainTrendsChart';
import { DomainBalanceChart } from './DomainBalanceChart';
import { AdherenceChart } from './AdherenceChart';
import { AdaptiveLogList } from './AdaptiveLogList';
import { CognitiveInsights } from './CognitiveInsights';
import { DemoPanel } from './DemoPanel';
import { exportSessionsCsv, exportSummaryPdf } from './exportReport';

type RangeDays = 30 | 90;

export default function CaregiverHome() {
  const { t } = useTranslation();
  const patient = useCaregiverPatient();
  const [range, setRange] = useState<RangeDays>(30);

  const trends = useLiveQuery(
    () => (patient ? getDomainTrends(patient.id, range) : undefined),
    [patient?.id, range],
  );
  const balance = useLiveQuery(
    () => (patient ? getDomainBalance(patient.id, range) : undefined),
    [patient?.id, range],
  );
  const adaptiveLog = useLiveQuery(
    () => (patient ? getAdaptiveLog(patient.id) : undefined),
    [patient?.id],
  );
  const adherence = useLiveQuery(
    () => (patient ? getAdherence(patient.id, range) : undefined),
    [patient?.id, range],
  );
  const insights = useLiveQuery(
    () => (patient ? getCognitiveInsights(patient.id) : undefined),
    [patient?.id],
  );
  const weeklySummary = useLiveQuery(async () => {
    if (!patient) return '';
    const [thisWeek, lastWeek, adherenceWeek] = await Promise.all([
      getDomainAveragesForRange(patient.id, 7, 0),
      getDomainAveragesForRange(patient.id, 14, 7),
      getAdherence(patient.id, 7),
    ]);
    return buildWeeklySummary({
      trendsThisWeek: [thisWeek],
      trendsLastWeek: [lastWeek],
      adherenceThisWeek: adherenceWeek.series,
    });
  }, [patient?.id]);

  async function handleExportPdf() {
    if (!patient || !adaptiveLog) return;
    await exportSummaryPdf(patient, weeklySummary ?? '', adaptiveLog);
  }

  async function handleExportCsv() {
    if (!patient) return;
    const sessions = await db.sessions.where('patientId').equals(patient.id).toArray();
    exportSessionsCsv(patient, sessions);
  }

  if (!patient) {
    return <p className="text-body">{t('dashboard.noData')}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-heading-lg font-bold">{t('dashboard.title')}</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void handleExportCsv()}>
            {t('dashboard.exportCsv')}
          </Button>
          <Button variant="secondary" onClick={() => void handleExportPdf()}>
            {t('dashboard.exportPdf')}
          </Button>
        </div>
      </div>

      <Card>
        <h2 className="text-action font-bold">{t('dashboard.weeklySummary')}</h2>
        <p className="mt-2 text-body text-text-muted">{weeklySummary || t('dashboard.noData')}</p>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-action font-bold">{t('dashboard.trends')}</h2>
          <div className="flex gap-2">
            {([30, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => setRange(d)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  range === d ? 'bg-primary text-primary-text' : 'bg-surface-alt text-text'
                }`}
              >
                {d === 30 ? t('dashboard.last30') : t('dashboard.last90')}
              </button>
            ))}
          </div>
        </div>
        {trends && trends.length > 0 ? (
          <div className="mt-4">
            <DomainTrendsChart data={trends} />
          </div>
        ) : (
          <p className="mt-4 text-body text-text-muted">{t('dashboard.noData')}</p>
        )}
      </Card>

      <Card>
        <h2 className="text-action font-bold">{t('dashboard.domainBalance')}</h2>
        <p className="text-body text-text-muted">{t('dashboard.domainBalanceBody', { name: patient.name })}</p>
        {balance && <DomainBalanceChart data={balance} />}
      </Card>

      <Card>
        <h2 className="text-action font-bold">{t('dashboard.adherence')}</h2>
        {adherence && (
          <>
            <p className="mt-1 text-body text-text-muted">
              {t('dashboard.streak')}: {adherence.streak}
            </p>
            <AdherenceChart data={adherence.series} />
          </>
        )}
      </Card>

      <Card>
        <h2 className="text-action font-bold">{t('dashboard.cognitiveInsights')}</h2>
        <p className="text-body text-text-muted">{t('dashboard.cognitiveInsightsBody')}</p>
        <div className="mt-4">
          {insights && <CognitiveInsights insights={insights} />}
        </div>
      </Card>

      <Card>
        <h2 className="text-action font-bold">{t('dashboard.adaptiveLog')}</h2>
        <p className="text-body text-text-muted">{t('dashboard.adaptiveLogBody')}</p>
        <div className="mt-4">
          <AdaptiveLogList changes={adaptiveLog ?? []} />
        </div>
      </Card>

      <DemoPanel />

      <p className="text-sm text-text-muted">{t('dashboard.disclaimer')}</p>
    </div>
  );
}
