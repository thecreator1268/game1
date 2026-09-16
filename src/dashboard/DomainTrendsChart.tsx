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
import { DOMAINS } from '@/games/gameList';
import type { DomainTrendPoint } from './dashboardData';
import { DOMAIN_COLOR } from './domainColors';

export function DomainTrendsChart({ data }: { data: DomainTrendPoint[] }) {
  const { t } = useTranslation();

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
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
          <Legend formatter={(value) => t(`domains.${value}`)} />
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
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
