import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Icon } from '@/components/IconSprite';
import { IconButton } from '@/components/IconButton';
import { CloseIcon } from '@/components/icons';
import { db } from '@/db/schema';
import { useCaregiverPatient } from '@/hooks/useCaregiverPatient';
import { useCountUp } from '@/hooks/useCountUp';
import { CaregiverChecklist } from './CaregiverChecklist';
import { useTypewriter } from '@/hooks/useTypewriter';
import {
  buildWeeklySummary,
  getAdaptiveLog,
  getAdherence,
  getCognitiveInsights,
  getDomainAveragesForRange,
  getAsymmetricDomainFlag,
  getDomainBalance,
  getDomainTrends,
} from './dashboardData';
import { DomainTrendsChart } from './DomainTrendsChart';
import { DomainBalanceChart } from './DomainBalanceChart';
import { AdherenceChart } from './AdherenceChart';
import { AdaptiveLogList } from './AdaptiveLogList';
import { CognitiveInsights } from './CognitiveInsights';
import { DemoPanel } from './DemoPanel';
import { exportDoctorImage, shareOrDownloadDoctorImage } from './exportDoctorImage';
import { GardenGrowthCard } from './GardenGrowthCard';
import { exportSessionsCsv, exportSummaryPdf } from './exportReport';
import { encodeSnapshot } from './sharedSnapshot';

type RangeDays = 30 | 90;

export default function CaregiverHome() {
  const { t } = useTranslation();
  const patient = useCaregiverPatient();
  const [range, setRange] = useState<RangeDays>(30);
  const [familyShareLink, setFamilyShareLink] = useState<string | null>(null);
  const [familyShareCopied, setFamilyShareCopied] = useState(false);

  // A stale link baked from the previous patient's data would otherwise
  // survive a switch via the multi-patient CaregiverPatientSwitcher. Reset
  // during render (the React-recommended way to respond to a prop/derived
  // value changing) rather than in an effect, so there's no extra render
  // where the stale link from the old patient is still on screen.
  const [lastPatientId, setLastPatientId] = useState(patient?.id);
  if (patient?.id !== lastPatientId) {
    setLastPatientId(patient?.id);
    setFamilyShareLink(null);
    setFamilyShareCopied(false);
  }

  // Same class of bug as RemindersManager's OCR scan: the encode/sign work
  // in handleShareWithFamily is async, so it's possible (if unlikely, given
  // how fast it is) for a patient switch to land mid-flight — this stops a
  // stale link for the old patient from appearing after that. Synced in an
  // effect (after commit), never written during render.
  const currentPatientIdRef = useRef(patient?.id);
  useEffect(() => {
    currentPatientIdRef.current = patient?.id;
  }, [patient?.id]);

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
  const asymmetryFlag = useLiveQuery(
    () => (patient ? getAsymmetricDomainFlag(patient.id) : undefined),
    [patient?.id],
  );
  // Dismiss is per dashboard visit, not persisted — reappearing after a
  // reload is intentional (it's a live re-check of real data, not a one-time
  // tip), and re-flagging a domain this same dashboard session would be
  // noisy. Keyed by domain+weeks so it resurfaces if the picture changes
  // (a different domain, or more weeks of the same one).
  const [dismissedAsymmetryKey, setDismissedAsymmetryKey] = useState<string | null>(null);
  const asymmetryKey = asymmetryFlag ? `${asymmetryFlag.domain}:${asymmetryFlag.weeks}` : null;
  const streakDisplay = useCountUp(adherence?.streak);
  // The one domain with the least practice this range — a lightweight,
  // real-data suggestion rather than the mockup's hardcoded copy. When 2+
  // domains share the minimum count (e.g. everything at zero for a new
  // patient) naming one would be arbitrary, so it reports a tie instead.
  const leastPlayed = useMemo(() => {
    if (!balance || balance.length === 0) return null;
    const min = Math.min(...balance.map((entry) => entry.sessionCount));
    const atMin = balance.filter((entry) => entry.sessionCount === min);
    return atMin.length === 1 ? { domain: atMin[0].domain } : { domain: null };
  }, [balance]);
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
  // Only the real, computed summary gets the reveal treatment — the static
  // "not enough data yet" fallback is instructional copy, not an insight
  // worth a dramatic typewriter reveal, and animating it risked a viewer
  // (or a screenshot/recording) catching it mid-type and reading as a
  // truncated sentence.
  const weeklySummaryTyped = useTypewriter(weeklySummary ?? '');

  async function handleExportPdf() {
    if (!patient || !adaptiveLog) return;
    await exportSummaryPdf(patient, weeklySummary ?? '', adaptiveLog);
  }

  async function handleExportCsv() {
    if (!patient) return;
    const sessions = await db.sessions.where('patientId').equals(patient.id).toArray();
    exportSessionsCsv(patient, sessions);
  }

  async function handleShareDoctorImage() {
    if (!patient || !balance || !adherence) return;
    const file = await exportDoctorImage(patient, weeklySummary ?? '', balance, adherence);
    if (file) await shareOrDownloadDoctorImage(file);
  }

  async function handleShareWithFamily() {
    if (!patient || !balance || !adherence) return;
    const sharePatientId = patient.id;
    setFamilyShareCopied(false);
    const { data, sig } = await encodeSnapshot({
      patientName: patient.name,
      generatedAt: Date.now(),
      weeklySummary: weeklySummary ?? '',
      domainBalance: balance,
      adherenceStreak: adherence.streak,
      adherenceSeries: adherence.series.slice(-14),
    });
    if (currentPatientIdRef.current !== sharePatientId) return;
    const url = `${window.location.origin}${import.meta.env.BASE_URL}?view=${data}&sig=${sig}`;

    const nav = navigator as Navigator & { share?: (data: { url: string; title?: string }) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ url, title: t('dashboard.shareWithFamily') });
        return;
      } catch {
        // Share sheet cancelled or failed — fall through to showing the link.
      }
    }
    setFamilyShareLink(url);
    try {
      await navigator.clipboard.writeText(url);
      setFamilyShareCopied(true);
    } catch {
      // Clipboard permission denied — the link is still shown below to copy by hand.
    }
  }

  if (!patient) {
    return <p className="text-body">{t('dashboard.noData')}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-heading-lg font-bold">{t('dashboard.title')}</h1>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="secondary" onClick={() => void handleExportCsv()}>
            {t('dashboard.exportCsv')}
          </Button>
          <Button variant="secondary" onClick={() => void handleExportPdf()}>
            {t('dashboard.exportPdf')}
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            {t('dashboard.printReport')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void handleShareDoctorImage()}
            disabled={!balance || !adherence}
          >
            {t('dashboard.shareForDoctor')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void handleShareWithFamily()}
            disabled={!balance || !adherence}
          >
            {t('dashboard.shareWithFamily')}
          </Button>
        </div>
      </div>

      <CaregiverChecklist />

      {familyShareLink && (
        <Card className="print:hidden">
          <p className="text-body text-text-muted">{t('dashboard.shareWithFamilyBody')}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              readOnly
              value={familyShareLink}
              onFocus={(e) => e.target.select()}
              className="tap-target min-w-0 flex-1 rounded-card border-2 border-border bg-surface px-4 text-sm"
            />
            <Button
              variant="secondary"
              onClick={() => {
                void navigator.clipboard.writeText(familyShareLink).then(() => setFamilyShareCopied(true));
              }}
            >
              {familyShareCopied ? t('common.copied') : t('common.copyLink')}
            </Button>
          </div>
        </Card>
      )}

      {/* Print-only: the on-screen header above has no patient name/date,
          but a page handed to a doctor needs both — mirrors exportSummaryPdf's
          header so the printed and PDF reports read the same way. */}
      <div className="hidden print:block">
        <p className="font-semibold">{patient.name}</p>
        <p className="text-sm text-text-muted">{new Date().toLocaleString()}</p>
      </div>

      <Card>
        <h2 className="text-action font-bold">{t('dashboard.weeklySummary')}</h2>
        <p className="mt-2 min-h-[1.65em] text-body text-text-muted">
          {weeklySummary ? weeklySummaryTyped : t('dashboard.noData')}
        </p>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-action font-bold">{t('dashboard.trends')}</h2>
          <div className="flex gap-4 print:hidden">
            {([30, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => setRange(d)}
                className={`tap-target rounded-full px-4 py-2 text-sm font-semibold ${
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

      <div className="print:hidden">
        <GardenGrowthCard patientId={patient.id} />
      </div>

      <Card>
        <h2 className="text-action font-bold">{t('dashboard.domainBalance')}</h2>
        <p className="text-body text-text-muted">{t('dashboard.domainBalanceBody', { name: patient.name })}</p>
        {balance && <DomainBalanceChart data={balance} />}
      </Card>

      {asymmetryFlag && asymmetryKey !== dismissedAsymmetryKey && (
        // A calm observation about existing data, not a new score or an
        // alert: same tinted-card language as the suggestion card below,
        // dismissible because it's a passive note, not an action to take.
        <div
          className="tint-orientation flex items-start gap-3 rounded-card border-[3px] border-text p-4 print:hidden"
        >
          <span className="icon-tile shrink-0" aria-hidden>
            <Icon name="trend" size={30} />
          </span>
          <p className="flex-1 text-body">
            {t('dashboard.asymmetryFlag.body', {
              domain: t(`domains.${asymmetryFlag.domain}`),
              name: patient.name,
              weeks: asymmetryFlag.weeks,
            })}
          </p>
          <IconButton
            label={t('common.close')}
            onClick={() => setDismissedAsymmetryKey(asymmetryKey)}
            className="h-10 w-10 shrink-0 bg-transparent shadow-none hover:bg-black/5"
          >
            <CloseIcon />
          </IconButton>
        </div>
      )}

      {leastPlayed && (
        <div
          className="tint-orientation flex items-start gap-3 rounded-card border-[3px] border-text p-4 print:hidden"
        >
          <span className="icon-tile shrink-0" aria-hidden>
            <Icon name="lightbulb" size={30} />
          </span>
          <p className="text-body">
            {leastPlayed.domain
              ? t('dashboard.suggestion', { domain: t(`domains.${leastPlayed.domain}`) })
              : t('dashboard.suggestionTied')}
          </p>
        </div>
      )}

      <Card>
        <h2 className="text-action font-bold">{t('dashboard.adherence')}</h2>
        {adherence && (
          <>
            <p className="mt-1 flex items-center gap-1.5 text-body text-text-muted">
              <Icon name="flame" size={18} className="text-[#F2A65A]" />
              {t('dashboard.streak')}: <span className="font-heading font-bold text-text">{streakDisplay}</span>
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

      <div className="print:hidden">
        <DemoPanel />
      </div>

      <p className="text-sm text-text-muted">{t('dashboard.disclaimer')}</p>
    </div>
  );
}
