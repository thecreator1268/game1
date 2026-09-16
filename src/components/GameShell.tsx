import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { GameId } from '@/db/types';
import { AboutGameModal } from './AboutGameModal';
import { BreakPromptWatcher } from './BreakPromptWatcher';
import { IconButton } from './IconButton';
import { HomeIcon, InfoIcon } from './icons';
import { OfflineBadge } from './OfflineBadge';

interface GameShellProps {
  gameId: GameId;
  level: number;
  score?: number;
  children: ReactNode;
}

// Shared chrome for every game screen: always-visible home button, per-game
// clinical info, level/score readout, and the fatigue watcher — one task per
// screen, no nested menus, matching the accessibility requirements.
export function GameShell({ gameId, level, score, children }: GameShellProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showAbout, setShowAbout] = useState(false);
  const name = t(`games.${gameId}.name`);
  const meaning = t(`games.${gameId}.meaning`);

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <IconButton label={t('common.home')} onClick={() => navigate('/patient')}>
          <HomeIcon />
        </IconButton>
        <div className="flex items-center gap-4">
          <span className="text-action font-bold">
            {name}
            {meaning && meaning !== name && (
              <span className="ml-1 text-sm font-normal text-text-muted">({meaning})</span>
            )}
          </span>
          <span className="rounded-full bg-surface-alt px-4 py-1 text-body font-semibold">
            {t('common.level')} {level}
          </span>
          {typeof score === 'number' && (
            <span className="rounded-full bg-surface-alt px-4 py-1 text-body font-semibold">
              {t('common.score')} {score}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <OfflineBadge />
          <IconButton label={t('common.aboutThisGame')} onClick={() => setShowAbout(true)}>
            <InfoIcon />
          </IconButton>
        </div>
      </header>

      <main className="px-4 pb-10 sm:px-6">{children}</main>

      {showAbout && <AboutGameModal gameId={gameId} onClose={() => setShowAbout(false)} />}
      <BreakPromptWatcher />
    </div>
  );
}
