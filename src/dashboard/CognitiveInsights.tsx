import { useTranslation } from 'react-i18next';
import type { DomainInsight } from './dashboardData';
import { DOMAIN_COLOR } from './domainColors';

const DIRECTION_GLYPH: Record<string, string> = {
  improving: '▲',
  declining: '▼',
  stable: '●',
  'insufficient-data': '…',
};

// Status color (not the domain's categorical color) carries the trend
// verdict — improving/declining/stable is a different semantic dimension
// from "which domain," so it gets its own color channel rather than
// overloading DOMAIN_COLOR. See engine/trendAnalysis.ts for the method.
const DIRECTION_CLASS: Record<string, string> = {
  improving: 'text-success',
  declining: 'text-danger',
  stable: 'text-text-muted',
  'insufficient-data': 'text-text-muted',
};

export function CognitiveInsights({ insights }: { insights: DomainInsight[] }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      {insights.map(({ domain, trend, anomalies }) => (
        <div key={domain} className="rounded-card border border-border bg-surface-alt p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: DOMAIN_COLOR[domain] }}
                aria-hidden
              />
              <span className="font-semibold">{t(`domains.${domain}`)}</span>
            </div>
            <span className={`text-lg font-bold ${DIRECTION_CLASS[trend.direction]}`}>
              {DIRECTION_GLYPH[trend.direction]} {t(`dashboard.insightDirection.${trend.direction}`)}
            </span>
          </div>
          <p className="mt-1 text-sm text-text-muted">{trend.reason}</p>

          {anomalies.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1 border-t border-border pt-2">
              {anomalies.map((a) => (
                <li key={a.timestamp} className="text-sm text-danger">
                  {new Date(a.timestamp).toLocaleDateString()}: {a.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
