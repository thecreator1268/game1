import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { Card } from '@/components/Card';
import { computeGardenGrowth, MAX_GARDEN_STAGE } from '@/engine/gardenGrowth';
import { useCountUp } from '@/hooks/useCountUp';

const STEM_GREEN = '#2f7d4f';
const POT_TERRACOTTA = '#b5651d';
const SOIL_BROWN = '#5b4636';
const PETAL_PINK = '#e08fa0';
const FLOWER_CENTER = '#f4c542';

const POT_TOP_Y = 96;

function GardenSvg({ stage }: { stage: number }) {
  const stemHeight = stage === 0 ? 0 : 12 + stage * 14;
  const stemTopY = POT_TOP_Y - stemHeight;
  const leafCount = Math.min(Math.max(0, stage - 1), 4);
  const hasFlower = stage >= MAX_GARDEN_STAGE;

  return (
    <svg viewBox="0 0 120 140" width={96} height={112} aria-hidden>
      <path d="M40 96 L80 96 L74 128 L46 128 Z" fill={POT_TERRACOTTA} />
      <rect x="38" y="90" width="44" height="8" rx="2" fill={POT_TERRACOTTA} />
      <ellipse cx="60" cy="96" rx="20" ry="4" fill={SOIL_BROWN} />

      {stemHeight > 0 && (
        <line
          x1="60"
          y1={POT_TOP_Y}
          x2="60"
          y2={stemTopY}
          stroke={STEM_GREEN}
          strokeWidth={4}
          strokeLinecap="round"
        />
      )}

      {Array.from({ length: leafCount }).map((_, i) => {
        const y = POT_TOP_Y - 14 - i * 16;
        const side = i % 2 === 0 ? 1 : -1;
        return (
          <ellipse
            key={i}
            cx={60 + side * 12}
            cy={y}
            rx={11}
            ry={6}
            fill={STEM_GREEN}
            transform={`rotate(${side * 35} ${60 + side * 12} ${y})`}
          />
        );
      })}

      {hasFlower && (
        <g>
          <circle cx="60" cy={stemTopY - 6} r="11" fill={PETAL_PINK} />
          <circle cx="60" cy={stemTopY - 6} r="4.5" fill={FLOWER_CENTER} />
        </g>
      )}
    </svg>
  );
}

export function GardenGrowthCard({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const growth = useLiveQuery(async () => {
    const sessions = await db.sessions.where('patientId').equals(patientId).toArray();
    return computeGardenGrowth(sessions.map((s) => s.startedAt));
  }, [patientId]);

  const weeksDisplay = useCountUp(growth?.consistentWeeks);

  if (!growth) return null;

  return (
    <Card>
      <h2 className="text-action font-bold">{t('dashboard.gardenGrowth')}</h2>
      <p className="text-body text-text-muted">{t('dashboard.gardenGrowthBody')}</p>
      <div className="mt-4 flex flex-wrap items-center gap-6">
        <GardenSvg stage={growth.stage} />
        <div className="flex-1">
          <p className="text-heading font-bold text-primary">
            {t('dashboard.gardenGrowthWeeks', { count: weeksDisplay })}
          </p>
          <div
            className="mt-2 h-3 w-full max-w-xs overflow-hidden rounded-full bg-surface-alt"
            role="img"
            aria-label={t('dashboard.gardenGrowthWeeks', { count: growth.consistentWeeks })}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(growth.stage / MAX_GARDEN_STAGE) * 100}%`, backgroundColor: STEM_GREEN }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
