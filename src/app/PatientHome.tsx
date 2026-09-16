import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useActivePatient } from '@/hooks/useActivePatient';
import { usePatientStore } from '@/store/patientStore';
import { IconButton } from '@/components/IconButton';
import { OfflineBadge } from '@/components/OfflineBadge';
import { HomeIcon } from '@/components/icons';
import { GAME_LIST, type GameMeta } from '@/games/gameList';
import { GAME_EMOJI } from '@/games/gameIcons';
import { useTodaysSet } from './useTodaysSet';
import { TodayReminders } from './TodayReminders';
import type { GameId, Domain } from '@/db/types';

function GameTile({ gameId, big = false }: { gameId: GameId; big?: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const name = t(`games.${gameId}.name`);
  const meaning = t(`games.${gameId}.meaning`);
  return (
    <button
      onClick={() => navigate(`/patient/game/${gameId}`)}
      className={`tap-target flex flex-col items-center justify-center gap-2 rounded-card border-2 border-border bg-surface p-4 text-center shadow-card transition-colors hover:bg-surface-alt active:scale-[0.97] ${
        big ? 'py-8' : 'py-5'
      }`}
    >
      <span className={big ? 'text-5xl' : 'text-4xl'} aria-hidden>
        {GAME_EMOJI[gameId]}
      </span>
      <span className="text-body font-semibold">{name}</span>
      {meaning && meaning !== name && <span className="text-xs text-text-muted">({meaning})</span>}
      <span className="text-sm text-text-muted">{t(`games.${gameId}.tagline`)}</span>
    </button>
  );
}

const DOMAIN_ORDER: Domain[] = ['memory', 'attention', 'routine', 'pattern', 'orientation'];

function groupByDomain(games: GameMeta[]): Record<Domain, GameMeta[]> {
  const result = {} as Record<Domain, GameMeta[]>;
  for (const domain of DOMAIN_ORDER) result[domain] = [];
  for (const g of games) result[g.domain].push(g);
  return result;
}

export default function PatientHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const activePatientId = usePatientStore((s) => s.activePatientId);
  const patient = useActivePatient();
  const todaysSet = useTodaysSet(patient?.id ?? '');
  const grouped = groupByDomain(GAME_LIST);

  useEffect(() => {
    if (!activePatientId) navigate('/', { replace: true });
  }, [activePatientId, navigate]);

  if (!patient) {
    // Either the live query hasn't resolved yet, or there's no active
    // patient at all — the effect above handles redirecting for the latter.
    return null;
  }

  const featured = [
    ...(todaysSet?.orientationGame ? [todaysSet.orientationGame] : []),
    ...(todaysSet?.rotatedGames ?? []),
  ];

  return (
    <div className="min-h-screen bg-bg pb-16">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <IconButton label={t('common.home')} onClick={() => navigate('/')}>
          <HomeIcon />
        </IconButton>
        <h1 className="text-heading font-bold text-primary">
          {t('patientHome.greeting', { name: patient.name })}
        </h1>
        <OfflineBadge />
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 sm:px-6">
        <TodayReminders patientId={patient.id} />

        <section>
          <h2 className="text-heading font-bold">{t('patientHome.todaysSet')}</h2>
          <p className="text-body text-text-muted">{t('patientHome.todaysSetBody')}</p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((gameId) => (
              <GameTile key={gameId} gameId={gameId} big />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-heading font-bold">{t('patientHome.moreGames')}</h2>
          <div className="mt-4 flex flex-col gap-6">
            {DOMAIN_ORDER.map((domain) => (
              <div key={domain}>
                <h3 className="mb-3 text-body font-semibold text-text-muted">
                  {t(`domains.${domain}`)}
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {grouped[domain].map((g) => (
                    <GameTile key={g.id} gameId={g.id} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
