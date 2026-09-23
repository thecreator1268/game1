import { useEffect, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { IconButton } from '@/components/IconButton';
import { OfflineBadge } from '@/components/OfflineBadge';
import { HomeIcon } from '@/components/icons';
import { useActivePatient } from '@/hooks/useActivePatient';
import { createEntranceFlag } from '@/hooks/useEntranceOnce';
import { getCurrentLevel } from '@/engine/gameSessionService';
import { MAX_LEVEL, MIN_LEVEL } from '@/engine/adaptiveEngine';
import { getGameMeta } from '@/games/gameList';
import { GAME_COMPONENTS } from '@/games/registry';
import type { GameId } from '@/db/types';

const LEVELS = Array.from({ length: MAX_LEVEL - MIN_LEVEL + 1 }, (_, i) => MIN_LEVEL + i);
const useLevelGridEntrance = createEntranceFlag();

// A patient (or a caregiver exploring with them) can freely pick any of the
// 10 levels — nothing is locked. The adaptive engine still automatically
// recommends a level for unattended daily play (Today's Set, "Play Again");
// this screen is what makes every level actually reachable and visible on
// demand, not just the one the algorithm currently suggests.
export default function LevelSelect() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();
  const patient = useActivePatient();
  const [recommended, setRecommended] = useState<number | null>(null);
  const isValidGameId = Boolean(gameId && gameId in GAME_COMPONENTS);
  const animateEntrance = useLevelGridEntrance();

  useEffect(() => {
    if (!patient?.id || !gameId || !isValidGameId) return;
    let cancelled = false;
    void getCurrentLevel(patient.id, gameId as GameId).then((lvl) => {
      if (!cancelled) setRecommended(lvl);
    });
    return () => {
      cancelled = true;
    };
  }, [patient?.id, gameId, isValidGameId]);

  if (!gameId || !isValidGameId) {
    return <Navigate to="/patient" replace />;
  }
  if (!patient) return null;

  const meta = getGameMeta(gameId as GameId);
  if (!meta.usesAdaptiveEngine) {
    return <Navigate to={`/patient/game/${gameId}`} replace />;
  }

  const name = t(`games.${gameId}.name`);
  const meaning = t(`games.${gameId}.meaning`);

  return (
    <div className="min-h-screen bg-bg pb-16">
      <header className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <IconButton label={t('common.home')} onClick={() => navigate('/patient')}>
          <HomeIcon />
        </IconButton>
        <span className="text-action font-bold">
          {name}
          {meaning && meaning !== name && (
            <span className="ml-1 text-sm font-normal text-text-muted">({meaning})</span>
          )}
        </span>
        <OfflineBadge />
      </header>

      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        <h1 className="text-heading font-bold">{t('levelSelect.title')}</h1>
        <p className="mt-1 text-body text-text-muted">{t('levelSelect.body')}</p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {LEVELS.map((lvl, i) => {
            const isRecommended = recommended === lvl;
            return (
              <button
                key={lvl}
                onClick={() => navigate(`/patient/game/${gameId}?level=${lvl}`)}
                style={animateEntrance ? ({ '--stagger-index': i } as CSSProperties) : undefined}
                className={`tap-press tap-target flex flex-col items-center justify-center gap-1 rounded-card border-2 p-4 text-center shadow-card ${
                  animateEntrance ? 'stagger-tile' : ''
                } ${
                  isRecommended
                    ? 'border-primary bg-primary text-primary-text'
                    : 'border-border bg-surface hover:bg-surface-alt'
                }`}
              >
                <span className="text-heading font-bold">{lvl}</span>
                {isRecommended && (
                  <span className="text-xs font-semibold uppercase">{t('levelSelect.recommended')}</span>
                )}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
