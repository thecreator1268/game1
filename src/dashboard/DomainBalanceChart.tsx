import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import type { DomainBalanceEntry } from './dashboardData';
import { DOMAIN_COLOR, DOMAIN_ICON } from './domainColors';

interface BarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  index?: number;
}

// Custom bar shape (Motion, not Recharts' own animation system) so bars can
// grow with a slight overshoot-and-settle spring, staggered per bar — the
// caregiver dashboard is the one place in the app that earns fancier motion
// (see the 2026 motion-system pass: adult audience, not the
// accessibility-constrained patient one). A stable module-level component
// (not a per-render factory) — Recharts mounts `shape` as a component type,
// so a new function identity on every render would remount it and replay
// the spring on every unrelated re-render, not just a real data change.
function AnimatedBar({ x = 0, y = 0, width = 0, height = 0, fill, index = 0 }: BarShapeProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  if (prefersReducedMotion) {
    return <rect x={x} y={y} width={width} height={height} rx={10} fill={fill} />;
  }
  return (
    <motion.rect
      x={x}
      width={width}
      rx={10}
      fill={fill}
      initial={{ height: 0, y: y + height }}
      animate={{ height, y }}
      transition={{ type: 'spring', stiffness: 210, damping: 16, mass: 0.9, delay: index * 0.06 }}
    />
  );
}

interface AvatarLabelProps {
  x?: string | number;
  y?: string | number;
  width?: string | number;
  index?: number;
}

// A small icon-avatar floating above each bar — the design reference's
// exact pattern (an icon per player, here an icon per domain) — so a bar's
// identity is never color-alone even for the coral/teal pair (see
// index.css's theme comment). Recharts calls this once per bar, passing
// that bar's own geometry; chartData is captured via closure so the same
// index can look up which domain this bar belongs to.
function makeDomainAvatar(chartData: (DomainBalanceEntry & { label: string })[]) {
  return function DomainAvatar({ x, y, width, index }: AvatarLabelProps) {
    if (x === undefined || y === undefined || width === undefined || index === undefined) return null;
    const domain = chartData[index]?.domain;
    if (!domain) return null;
    const nx = Number(x);
    const ny = Number(y);
    const nw = Number(width);
    const size = 22;
    return (
      <g transform={`translate(${nx + nw / 2 - size / 2}, ${ny - size - 6})`} color="var(--color-text)">
        <use
          href={`#i-${DOMAIN_ICON[domain]}`}
          width={size}
          height={size}
          stroke="currentColor"
          fill="none"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  };
}

export function DomainBalanceChart({ data }: { data: DomainBalanceEntry[] }) {
  const { t } = useTranslation();
  const chartData = data.map((d) => ({ ...d, label: t(`domains.${d.domain}`) }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 28, right: 16, bottom: 8, left: -16 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
          <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} allowDecimals={false} width={32} />
          <Tooltip formatter={(value) => [value, t('dashboard.title')]} />
          <Bar
            dataKey="sessionCount"
            isAnimationActive={false}
            shape={AnimatedBar}
            label={makeDomainAvatar(chartData)}
          >
            {chartData.map((entry) => (
              <Cell key={entry.domain} fill={DOMAIN_COLOR[entry.domain]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
