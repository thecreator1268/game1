import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/IconSprite';
import { getGameMeta } from '@/games/gameList';
import type { LevelChange } from '@/db/types';
import { DOMAIN_TINT_CLASS } from './domainColors';

function directionOf(change: LevelChange): 'up' | 'down' {
  return change.toLevel > change.fromLevel ? 'up' : 'down';
}

export function AdaptiveLogList({ changes }: { changes: LevelChange[] }) {
  const { t } = useTranslation();

  if (changes.length === 0) {
    return <p className="text-body text-text-muted">{t('dashboard.noData')}</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {changes.map((change) => {
        const dir = directionOf(change);
        const domain = getGameMeta(change.gameId).domain;
        const name = t(`games.${change.gameId}.name`);
        const meaning = t(`games.${change.gameId}.meaning`);
        return (
          <li
            key={change.id}
            className={`flex min-h-[76px] items-center gap-3 rounded-card border-[2.5px] border-text p-3 ${DOMAIN_TINT_CLASS[domain]}`}
          >
            <span
              aria-hidden
              className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full border-[2.5px] border-text bg-surface"
            >
              {dir === 'up' ? (
                <span className="text-success">
                  <Icon name="trend" size={26} />
                </span>
              ) : (
                <span
                  className="h-[22px] w-[22px] rounded-full border-2 border-text"
                  style={{ background: `var(--domain-${domain})` }}
                />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-body font-semibold">
                {name}
                {meaning && meaning !== name && (
                  <span className="font-normal text-text-muted"> ({meaning})</span>
                )}
                : {change.fromLevel} → {change.toLevel}
              </p>
              <p className="text-sm text-text">{change.reason}</p>
              <p className="text-xs text-text-muted">
                {new Date(change.timestamp).toLocaleString()} · {t(`domains.${domain}`)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
