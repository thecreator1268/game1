import { useTranslation } from 'react-i18next';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Icon } from '@/components/IconSprite';
import type { Domain } from '@/db/types';
import { DOMAINS } from '@/games/gameList';
import type { DomainTrendPoint } from './dashboardData';
import { DOMAIN_COLOR, DOMAIN_ICON } from './domainColors';

// Recharts' built-in Legend only offers a generic swatch/dash per series —
// this app's rule is that a domain's identity is never color-alone (see
// index.css's theme comment on the coral/teal CVD pair), so this legend
// needs the same per-domain icon the Domain Balance chart's bar avatars use
// just below it, not Recharts' default.
function DomainLegend({ payload }: { payload?: { value: string; color?: string }[] }) {
  const { t } = useTranslation();
  if (!payload) return null;
  return (
    <ul className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-2">
      {payload.map((entry) => {
        const domain = entry.value as Domain;
        return (
          <li key={domain} className="flex items-center gap-1.5 text-sm text-text-muted">
            <Icon name={DOMAIN_ICON[domain]} size={16} style={{ color: entry.color }} />
            {t(`domains.${domain}`)}
          </li>
        );
      })}
    </ul>
  );
}

export function DomainTrendsChart({ data }: { data: DomainTrendPoint[] }) {
  const { t } = useTranslation();

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#e1e0d9" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#898781' }}
            tickFormatter={(d: string) => d.slice(5)}
            minTickGap={24}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: '#898781' }}
            tickFormatter={(v: number) => `${v}%`}
            width={44}
          />
          <Tooltip
            formatter={(value, name) => [`${value}%`, t(`domains.${String(name)}`)]}
            labelFormatter={(label) => label}
          />
          <Legend content={<DomainLegend />} />
          {DOMAINS.map((domain) => (
            <Line
              key={domain}
              type="monotone"
              dataKey={domain}
              name={domain}
              stroke={DOMAIN_COLOR[domain]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
              connectNulls
              animationDuration={700}
              animationEasing="ease-out"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
