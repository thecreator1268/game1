import { useTranslation } from 'react-i18next';
import type { LevelChange } from '@/db/types';

const DIRECTION_LABEL: Record<'up' | 'down', string> = { up: '▲', down: '▼' };

function directionOf(change: LevelChange): 'up' | 'down' {
  return change.toLevel > change.fromLevel ? 'up' : 'down';
}

export function AdaptiveLogList({ changes }: { changes: LevelChange[] }) {
  const { t } = useTranslation();

  if (changes.length === 0) {
    return <p className="text-body text-text-muted">{t('dashboard.noData')}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {changes.map((change) => {
        const dir = directionOf(change);
        return (
          <li
            key={change.id}
            className="flex items-start gap-3 rounded-card border border-border bg-surface-alt p-3"
          >
            <span className={`text-lg font-bold ${dir === 'up' ? 'text-success' : 'text-danger'}`}>
              {DIRECTION_LABEL[dir]}
            </span>
            <div>
              <p className="text-body font-semibold">
                {t(`games.${change.gameId}.name`)}: {change.fromLevel} → {change.toLevel}
              </p>
              <p className="text-sm text-text-muted">{change.reason}</p>
              <p className="text-xs text-text-muted">{new Date(change.timestamp).toLocaleString()}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
