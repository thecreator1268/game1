import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MOTION_SLOW_MS } from '@/lib/motionTokens';
import type { AdherenceDay } from './dashboardData';

const SEQUENTIAL_BLUE = '#256abf';

export function AdherenceChart({ data }: { data: AdherenceDay[] }) {
  const chartData = data.map((d) => ({
    ...d,
    pct: d.expected > 0 ? Math.round((d.taken / d.expected) * 100) : 0,
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
          <CartesianGrid stroke="#e1e0d9" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#898781' }}
            tickFormatter={(d: string) => d.slice(5)}
            minTickGap={24}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: '#898781' }}
            tickFormatter={(v: number) => `${v}%`}
            width={40}
          />
          <Tooltip
            formatter={(_value, _name, props) => {
              const payload = props.payload as (AdherenceDay & { pct: number }) | undefined;
              return [`${payload?.taken ?? 0} / ${payload?.expected ?? 0}`, 'Taken'];
            }}
          />
          <Bar
            dataKey="pct"
            fill={SEQUENTIAL_BLUE}
            radius={[4, 4, 0, 0]}
            animationDuration={MOTION_SLOW_MS}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
