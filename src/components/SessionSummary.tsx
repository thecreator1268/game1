import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LevelDecision } from '@/engine/adaptiveEngine';
import { Button } from './Button';
import { Card } from './Card';
import { Icon } from './IconSprite';
import { LevelUpBadge } from './LevelUpBadge';

interface SessionSummaryProps {
  accuracyPct: number;
  levelDecision: LevelDecision | null;
  showPersonalBest: boolean;
  onPlayAgain: () => void;
  onGoHome: () => void;
  /** Omit for games with no difficulty levels (e.g. Aaj Ka Din). */
  onChooseLevel?: () => void;
}

export function SessionSummary({
  accuracyPct,
  levelDecision,
  showPersonalBest,
  onPlayAgain,
  onGoHome,
  onChooseLevel,
}: SessionSummaryProps) {
  const { t } = useTranslation();

  // A brief, skippable celebration, never a blocker: the badge itself
  // auto-dismisses after ~1.2s (never sits there forever), but every button
  // below stays fully clickable the whole time regardless — "skippable by
  // next tap" just falls out of the badge being decorative, not gating.
  // Re-arms on prop change during render (e.g. "Play Again" reusing the same
  // instance) rather than in an effect — the effect's only job is the
  // dismiss timer, an actual external-timer side effect.
  const [lastShowPersonalBest, setLastShowPersonalBest] = useState(showPersonalBest);
  const [showBadge, setShowBadge] = useState(showPersonalBest);
  if (showPersonalBest !== lastShowPersonalBest) {
    setLastShowPersonalBest(showPersonalBest);
    setShowBadge(showPersonalBest);
  }
  useEffect(() => {
    if (!showBadge) return undefined;
    const timer = setTimeout(() => setShowBadge(false), 1200);
    return () => clearTimeout(timer);
  }, [showBadge]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-10 text-center">
      <Card className="w-full">
        <h2 className="text-heading-lg font-bold text-primary">{t('common.wellDone')}</h2>
        <p className="text-action mt-2">
          {t('common.score')}: {Math.round(accuracyPct)}%
        </p>

        {showBadge && (
          <div className="mt-4 flex justify-center level-up-badge">
            <span className="pill-ink px-5 py-3 font-heading text-body">
              <Icon name="spark" size={18} className="text-[var(--domain-memory)]" />
              {t('common.personalBest')}
            </span>
          </div>
        )}

        {levelDecision && levelDecision.changed && levelDecision.direction === 'up' && (
          <LevelUpBadge label={`${t('common.level')} ${levelDecision.newLevel}`} />
        )}
        {levelDecision && levelDecision.changed && levelDecision.direction === 'down' && (
          <p className="mt-4 text-body text-text-muted">
            {t('common.level')} {levelDecision.newLevel}
          </p>
        )}
      </Card>

      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <Button variant="secondary" className="flex-1" onClick={onGoHome}>
          {t('common.home')}
        </Button>
        {onChooseLevel && (
          <Button variant="secondary" className="flex-1" onClick={onChooseLevel}>
            {t('levelSelect.chooseLevel')}
          </Button>
        )}
        <Button className="flex-1" onClick={onPlayAgain}>
          {t('patientHome.playAgain')}
        </Button>
      </div>
    </div>
  );
}
