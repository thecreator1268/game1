import { useTranslation } from 'react-i18next';
import type { LevelDecision } from '@/engine/adaptiveEngine';
import { Button } from './Button';
import { Card } from './Card';
import { StarIcon } from './icons';

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

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-10 text-center">
      <Card className="w-full">
        <h2 className="text-heading-lg font-bold text-primary">{t('common.wellDone')}</h2>
        <p className="text-action mt-2">
          {t('common.score')}: {Math.round(accuracyPct)}%
        </p>

        {showPersonalBest && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-card bg-surface-alt p-4 text-accent">
            <StarIcon width={24} height={24} />
            <span className="text-body font-semibold">{t('common.personalBest')}</span>
          </div>
        )}

        {levelDecision && levelDecision.changed && (
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
