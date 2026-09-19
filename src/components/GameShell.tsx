import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { GameId } from '@/db/types';
import { getGameMeta } from '@/games/gameList';
import { stopSpeaking } from '@/lib/speech';
import { AboutGameModal } from './AboutGameModal';
import { BreakPromptWatcher } from './BreakPromptWatcher';
import { IconButton } from './IconButton';
import { BackIcon, InfoIcon } from './icons';
import { Icon } from './IconSprite';
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
  const hasLevels = getGameMeta(gameId).usesAdaptiveEngine;

  // A VoicePrompt tap starts browser speech synthesis, which is a global
  // background process independent of React — without this, leaving a game
  // (Home, or jumping to level-select) mid-sentence let it keep talking.
  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <header className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button className="pill-flat tap-press tap-target" onClick={() => navigate('/patient')}>
          <BackIcon width={20} height={20} />
          {t('common.back')}
        </button>
        <span className="pill-flat" style={{ background: 'var(--domain-memory)' }}>
          <Icon name="clock" size={16} />
          {t('common.takeYourTime')}
        </span>
        <div className="flex items-center gap-3">
          <OfflineBadge />
          <IconButton label={t('common.aboutThisGame')} onClick={() => setShowAbout(true)}>
            <InfoIcon />
          </IconButton>
        </div>
      </header>

      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-4 pb-2 sm:px-6">
        <span className="font-heading text-action font-bold">
          {name}
          {meaning && meaning !== name && (
            <span className="ml-1 font-body text-sm font-normal text-text-muted">({meaning})</span>
          )}
        </span>
        {hasLevels ? (
          <button
            onClick={() => navigate(`/patient/game/${gameId}/levels`)}
            className="pill-flat tap-press tap-target"
          >
            {t('common.level')} {level}
          </button>
        ) : (
          <span className="pill-flat">
            {t('common.level')} {level}
          </span>
        )}
        {typeof score === 'number' && <span className="pill-flat">{t('common.score')} {score}</span>}
      </div>

      <main className="px-4 pb-10 sm:px-6">{children}</main>

      {showAbout && <AboutGameModal gameId={gameId} onClose={() => setShowAbout(false)} />}
      <BreakPromptWatcher />
    </div>
  );
}
