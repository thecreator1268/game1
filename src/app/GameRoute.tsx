import { Suspense } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { GameId } from '@/db/types';
import { GAME_COMPONENTS } from '@/games/registry';

export default function GameRoute() {
  const { gameId } = useParams<{ gameId: string }>();
  const { t } = useTranslation();

  if (!gameId || !(gameId in GAME_COMPONENTS)) {
    return <Navigate to="/patient" replace />;
  }

  const Component = GAME_COMPONENTS[gameId as GameId];
  return (
    <Suspense fallback={<div className="py-20 text-center text-body">{t('common.loading')}</div>}>
      <Component />
    </Suspense>
  );
}
