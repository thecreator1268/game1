import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { GameId } from '@/db/types';
import { GameShell } from '@/components/GameShell';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

// Temporary placeholder used only while a game is still being built — wired
// into the real GameShell/routing so the rest of the app is fully testable
// before every one of the 13 games is finished.
export function ComingSoon({ gameId }: { gameId: GameId }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <GameShell gameId={gameId} level={1}>
      <div className="mx-auto max-w-lg py-16 text-center">
        <Card>
          <p className="text-action font-semibold">{t(`games.${gameId}.tagline`)}</p>
          <p className="mt-3 text-body text-text-muted">{t(`games.${gameId}.instructions`)}</p>
          <p className="mt-6 text-body text-accent">Coming soon in this build.</p>
          <Button className="mt-6" onClick={() => navigate('/patient')}>
            {t('common.home')}
          </Button>
        </Card>
      </div>
    </GameShell>
  );
}
