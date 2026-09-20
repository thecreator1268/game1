import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, type CSSProperties } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useActivePatient } from '@/hooks/useActivePatient';
import { usePatientStore } from '@/store/patientStore';
import { IconButton } from '@/components/IconButton';
import { OfflineBadge } from '@/components/OfflineBadge';
import { HomeIcon } from '@/components/icons';
import { Icon } from '@/components/IconSprite';
import { Reveal } from '@/components/Reveal';
import { GAME_LIST, getGameMeta, type GameMeta } from '@/games/gameList';
import { DOMAIN_CARD_CLASS } from '@/dashboard/domainColors';
import { MAX_LEVEL } from '@/engine/adaptiveEngine';
import { getCurrentLevel } from '@/engine/gameSessionService';
import { useTodaysSet } from './useTodaysSet';
import { useStreak } from './useStreak';
import { TodayReminders } from './TodayReminders';
import type { GameId, Domain } from '@/db/types';

// One consistent mascot shape, "vary blob radius/mouth slightly per card
// for character" — picked deterministically from the game id so a card
// never re-rolls its own face between renders.
const BLOB_VARIANTS = ['', 'blob-v2', 'blob-v3', 'blob-v4'];
function blobVariant(gameId: string): string {
  let hash = 0;
  for (let i = 0; i < gameId.length; i++) hash = (hash * 31 + gameId.charCodeAt(i)) >>> 0;
  return BLOB_VARIANTS[hash % BLOB_VARIANTS.length];
}

// Plays the card stagger once per app session (module-level, survives
// PatientHome unmounting when a patient goes to play a game and mounting
// again when they come back) — a fade-in every single time this screen
// re-appears is exactly the "looks AI-scaffolded" tell this pass is meant
// to remove, not a polish win.
let hasPlayedHomeEntrance = false;

function BlobMascot({ gameId, hero = false }: { gameId: string; hero?: boolean }) {
  return (
    <div className={`blob-mascot ${blobVariant(gameId)} ${hero ? 'blob-mascot-hero' : ''}`} aria-hidden>
      <div className="blob-face">
        <div className="blob-eye blob-eye-l" />
        <div className="blob-eye blob-eye-r" />
        <div className="blob-blush blob-blush-l" />
        <div className="blob-blush blob-blush-r" />
        <div className="blob-mouth" />
      </div>
    </div>
  );
}

function GameCard({
  gameId,
  hero = false,
  staggerIndex,
}: {
  gameId: GameId;
  hero?: boolean;
  staggerIndex: number | null;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patientId = usePatientStore((s) => s.activePatientId) ?? '';
  const name = t(`games.${gameId}.name`);
  const meta = getGameMeta(gameId);
  const level = useLiveQuery(
    () => (meta.usesAdaptiveEngine ? getCurrentLevel(patientId, gameId) : Promise.resolve(null)),
    [patientId, gameId],
    null,
  );
  // Routine domain's card fills with the darkest hue in the set — its own
  // ink text/pips would disappear, so it flips to the page's light ink
  // color instead, exactly like the design reference's teal card.
  const inverted = meta.domain === 'routine';

  // Today's Set cards render straight, with no rotate() and no ordering
  // cue (no sticker, no number badge) — they're 3 free, unordered choices,
  // not a forced sequence. Only "hero" (bigger card) and the speech-bubble
  // name tag distinguish them from the rest of the game library.
  return (
    <button
      onClick={() => navigate(`/patient/game/${gameId}`)}
      style={staggerIndex === null ? undefined : ({ '--stagger-index': staggerIndex } as CSSProperties)}
      className={`game-card ${DOMAIN_CARD_CLASS[meta.domain]} ${staggerIndex === null ? '' : 'stagger-tile'} ${
        hero ? 'game-card-hero w-full' : ''
      }`}
    >
      {/* In flow (not absolute) so a long, wrapping name pushes the card
          taller instead of colliding with the mascot below it. */}
      <span className="speech-tag -mx-1 -mt-1 mb-auto self-stretch">{name}</span>
      <BlobMascot gameId={gameId} hero={hero} />
      {/* Always dark ink, full opacity, even on the teal Routine card — per
          the design spec's explicit rule ("dark ink on light/pastel
          grounds, everywhere, including teal — never light or alpha-muted
          text on a colored ground"). Cream text directly on this specific
          teal actually measures LOWER contrast than ink does (~3.6:1 vs
          ~4.9:1) — alpha-muting either one only makes it worse, which is
          why this caption never reduces opacity like a "muted" label
          normally would. Only the pill below inverts, because that pill
          carries its own light background — ink text on a light chip, not
          on the card color directly. */}
      <span className="mb-2 text-[11px] font-bold uppercase tracking-wide text-text">
        {t(`domains.${meta.domain}`)}
      </span>
      {level !== null && (
        <span className="mb-2.5 flex gap-1" aria-hidden>
          {Array.from({ length: MAX_LEVEL }, (_, i) => (
            <span key={i} className={`pip ${i < level ? 'pip-on' : ''}`} />
          ))}
        </span>
      )}
      <span className={`pill-ink self-start ${inverted ? 'bg-bg text-text' : ''}`}>
        {t('common.play')}
        <Icon name="play" size={12} />
      </span>
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

function timeOfDayGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'patientHome.greetingMorning';
  if (hour < 17) return 'patientHome.greetingAfternoon';
  return 'patientHome.greetingEvening';
}

export default function PatientHome() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const activePatientId = usePatientStore((s) => s.activePatientId);
  const patient = useActivePatient();
  const todaysSet = useTodaysSet(patient?.id ?? '');
  const streak = useStreak(patient?.id ?? '');
  const grouped = groupByDomain(GAME_LIST);
  const [animateEntrance] = useState(() => {
    const isFirstThisSession = !hasPlayedHomeEntrance;
    hasPlayedHomeEntrance = true;
    return isFirstThisSession;
  });
  let cardIndex = 0;

  useEffect(() => {
    if (!activePatientId) navigate('/', { replace: true });
  }, [activePatientId, navigate]);

  if (!patient) {
    // Either the live query hasn't resolved yet, or there's no active
    // patient at all — the effect above handles redirecting for the latter.
    return null;
  }

  const featured = todaysSet ?? [];

  const dateLabel = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <div className="min-h-screen bg-bg pb-16">
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <IconButton label={t('common.home')} onClick={() => navigate('/')}>
            <HomeIcon />
          </IconButton>
          <span
            aria-hidden
            className="flex h-10 w-10 items-center justify-center rounded-swatch border-[3px] border-text font-heading text-lg font-extrabold text-text"
            style={{ background: 'var(--domain-memory)' }}
          >
            S
          </span>
          <span className="font-heading text-body font-bold">{t('common.appName')}</span>
        </div>
        <div className="flex items-center gap-3">
          {!!streak && streak >= 1 && (
            <span className="pill-flat pill-pulse-once">
              <span className="flame-sway text-[#F2A65A]" aria-hidden>
                <Icon name="flame" size={16} />
              </span>
              {t('patientHome.streak', { count: streak })}
            </span>
          )}
          <OfflineBadge />
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pt-4 sm:px-6">
        <div>
          <p className="flex items-center gap-2 text-body text-text-muted">
            <Icon name="calendar" size={18} />
            {dateLabel}
          </p>
          <h1 className="mt-1 text-heading-lg font-bold leading-[1.05] tracking-tight">
            {t(timeOfDayGreetingKey())}
            <br />
            {patient.name}
          </h1>
          <div className="mt-2 h-[9px] w-[132px] rounded-[3px] border-2 border-text bg-[var(--domain-memory)]" />
        </div>

        <TodayReminders patientId={patient.id} />

        <section>
          <div className="flex items-center gap-3">
            <h2 className="text-heading font-bold">{t('patientHome.todaysSet')}</h2>
            <span className="dash-rule" aria-hidden />
          </div>
          <p className="text-body text-text-muted">{t('patientHome.todaysSetBody')}</p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {featured.map((gameId) => (
              <GameCard
                key={gameId}
                gameId={gameId}
                hero
                staggerIndex={animateEntrance ? cardIndex++ : null}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-heading font-bold">{t('patientHome.moreGames')}</h2>
          <p className="text-body text-text-muted">{t('patientHome.moreGamesBody')}</p>
          <div className="mt-4 flex flex-col gap-7">
            {DOMAIN_ORDER.map((domain) => (
              <Reveal key={domain}>
                <div>
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="domain-swatch" style={{ background: `var(--domain-${domain})` }} aria-hidden />
                    <h3 className="text-body font-semibold text-text-muted">{t(`domains.${domain}`)}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {grouped[domain].map((g) => (
                      <GameCard
                        key={g.id}
                        gameId={g.id}
                        staggerIndex={animateEntrance ? cardIndex++ : null}
                      />
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
