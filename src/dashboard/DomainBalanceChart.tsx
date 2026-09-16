import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DomainBalanceEntry } from './dashboardData';
import { DOMAIN_COLOR } from './domainColors';

export function DomainBalanceChart({ data }: { data: DomainBalanceEntry[] }) {
  const { t } = useTranslation();
  const chartData = data.map((d) => ({ ...d, label: t(`domains.${d.domain}`) }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
          <CartesianGrid stroke="#e1e0d9" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#898781' }} />
          <YAxis tick={{ fontSize: 12, fill: '#898781' }} allowDecimals={false} width={32} />
          <Tooltip formatter={(value) => [value, t('dashboard.title')]} />
          <Bar dataKey="sessionCount" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.domain} fill={DOMAIN_COLOR[entry.domain]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
