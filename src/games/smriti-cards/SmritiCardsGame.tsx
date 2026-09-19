import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GameShell } from '@/components/GameShell';
import { Icon, type IconName } from '@/components/IconSprite';
import { SessionSummary } from '@/components/SessionSummary';
import { VoicePrompt } from '@/components/VoicePrompt';
import { useActivePatient } from '@/hooks/useActivePatient';
import { useLevelParam } from '@/hooks/useLevelParam';
import { getCurrentLevel, recordGameSession } from '@/engine/gameSessionService';
import { isPersonalBest, type LevelDecision } from '@/engine/adaptiveEngine';
import { useFatigueStore } from '@/store/fatigueStore';
import type { ErrorType } from '@/db/types';
import { CARD_ITEMS } from './items';
import { gridColumnsForPairCount, pairsForLevel } from './params';

interface DeckCard {
  key: string;
  itemId: string;
  icon: IconName;
  label: string;
  matched: boolean;
}

type CoachKey = 'coachIdle' | 'coachFirstFlip' | 'coachMatch' | 'coachMiss' | 'coachMissFollowup' | 'coachComplete';

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildDeck(pairCount: number): DeckCard[] {
  const chosen = shuffle(CARD_ITEMS).slice(0, pairCount);
  const cards: DeckCard[] = chosen.flatMap((item, idx) => [
    {
      key: `${item.id}-a-${idx}`,
      itemId: item.id,
      icon: item.icon,
      label: item.label,
      matched: false,
    },
    {
      key: `${item.id}-b-${idx}`,
      itemId: item.id,
      icon: item.icon,
      label: item.label,
      matched: false,
    },
  ]);
  return shuffle(cards);
}

// A handful of fixed outward directions for the match-burst chips — no
// randomness needed for a 4-chip ring, and fixed values keep every burst
// looking deliberate rather than jittery.
const BURST_VECTORS: Array<[number, number]> = [
  [26, -22],
  [-26, -22],
  [22, 26],
  [-22, 26],
];

type Phase = 'loading' | 'playing' | 'summary';
const MISMATCH_PAUSE_MS = 900;
const MATCH_PAUSE_MS = 450;
const MISS_FOLLOWUP_MS = 1100;

export default function SmritiCardsGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patient = useActivePatient();
  const levelParam = useLevelParam();
  const recordGamePlayed = useFatigueStore((s) => s.recordGamePlayed);

  const [phase, setPhase] = useState<Phase>('loading');
  const [level, setLevel] = useState(1);
  const [deck, setDeck] = useState<DeckCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [matchedCount, setMatchedCount] = useState(0);
  const [guessDurations, setGuessDurations] = useState<number[]>([]);
  const [errorTypes, setErrorTypes] = useState<ErrorType[]>([]);
  const [levelDecision, setLevelDecision] = useState<LevelDecision | null>(null);
  const [coachKey, setCoachKey] = useState<CoachKey>('coachIdle');
  const [burstKeys, setBurstKeys] = useState<Set<string>>(new Set());

  const sessionStartRef = useRef(0);
  const guessStartRef = useRef(0);
  const firstFlipShownRef = useRef(false);
  const missFollowupTimerRef = useRef<number | undefined>(undefined);

  const pairCount = useMemo(() => pairsForLevel(level), [level]);
  const columns = gridColumnsForPairCount(pairCount);

  async function startRound(patientId: string, forcedLevel?: number) {
    const currentLevel = forcedLevel ?? (await getCurrentLevel(patientId, 'smriti-cards'));
    window.clearTimeout(missFollowupTimerRef.current);
    firstFlipShownRef.current = false;
    setLevel(currentLevel);
    setDeck(buildDeck(pairsForLevel(currentLevel)));
    setFlipped([]);
    setBusy(false);
    setMatchedCount(0);
    setGuessDurations([]);
    setErrorTypes([]);
    setLevelDecision(null);
    setCoachKey('coachIdle');
    setBurstKeys(new Set());
    sessionStartRef.current = Date.now();
    guessStartRef.current = Date.now();
    setPhase('playing');
  }

  useEffect(() => {
    if (patient?.id) void startRound(patient.id, levelParam ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);

  useEffect(() => () => window.clearTimeout(missFollowupTimerRef.current), []);

  async function finishRound() {
    if (!patient) return;
    const totalGuesses = guessDurations.length;
    const accuracy = totalGuesses > 0 ? Math.min(1, pairCount / totalGuesses) : 1;
    const avgResponseMs =
      totalGuesses > 0 ? guessDurations.reduce((a, b) => a + b, 0) / totalGuesses : 0;

    const { levelDecision: decision } = await recordGameSession({
      patientId: patient.id,
      gameId: 'smriti-cards',
      level,
      score: Math.round(accuracy * 100),
      accuracy,
      avgResponseMs,
      errorTypes,
      startedAt: sessionStartRef.current,
      endedAt: Date.now(),
    });
    recordGamePlayed();
    setLevelDecision(decision);
    setPhase('summary');
  }

  useEffect(() => {
    if (phase === 'playing' && pairCount > 0 && matchedCount === pairCount) {
      void finishRound();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedCount, phase]);

  function handleCardTap(index: number) {
    if (busy || phase !== 'playing') return;
    if (flipped.includes(index) || deck[index].matched) return;

    const nextFlipped = [...flipped, index];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 1 && !firstFlipShownRef.current) {
      firstFlipShownRef.current = true;
      setCoachKey('coachFirstFlip');
    }

    if (nextFlipped.length === 2) {
      setBusy(true);
      const [i, j] = nextFlipped;
      const isMatch = deck[i].itemId === deck[j].itemId;
      const duration = Date.now() - guessStartRef.current;

      window.setTimeout(
        () => {
          setGuessDurations((prev) => [...prev, duration]);
          setErrorTypes((prev) => [...prev, isMatch ? 'none' : 'wrong-choice']);

          if (isMatch) {
            setDeck((prev) =>
              prev.map((c, idx) => (idx === i || idx === j ? { ...c, matched: true } : c)),
            );
            setMatchedCount((prev) => {
              const next = prev + 1;
              setCoachKey(next === pairCount ? 'coachComplete' : 'coachMatch');
              return next;
            });
            setBurstKeys((prev) => new Set(prev).add(deck[i].key).add(deck[j].key));
            window.setTimeout(() => {
              setBurstKeys((prev) => {
                const next = new Set(prev);
                next.delete(deck[i].key);
                next.delete(deck[j].key);
                return next;
              });
            }, 900);
          } else {
            setCoachKey('coachMiss');
            window.clearTimeout(missFollowupTimerRef.current);
            missFollowupTimerRef.current = window.setTimeout(() => {
              setCoachKey('coachMissFollowup');
            }, MISS_FOLLOWUP_MS);
          }
          setFlipped([]);
          setBusy(false);
          guessStartRef.current = Date.now();
        },
        isMatch ? MATCH_PAUSE_MS : MISMATCH_PAUSE_MS,
      );
    }
  }

  if (!patient) return null;

  if (phase === 'loading') {
    return (
      <GameShell gameId="smriti-cards" level={level}>
        <p className="py-20 text-center text-body">{t('common.loading')}</p>
      </GameShell>
    );
  }

  if (phase === 'summary') {
    const totalGuesses = guessDurations.length;
    const accuracyPct = totalGuesses > 0 ? Math.min(1, pairCount / totalGuesses) * 100 : 100;
    const displayedLevel = levelDecision?.changed ? levelDecision.newLevel : level;
    return (
      <GameShell gameId="smriti-cards" level={level}>
        <SessionSummary
          accuracyPct={accuracyPct}
          levelDecision={levelDecision}
          showPersonalBest={isPersonalBest(displayedLevel)}
          onPlayAgain={() => void startRound(patient.id)}
          onGoHome={() => navigate('/patient')}
          onChooseLevel={() => navigate('/patient/game/smriti-cards/levels')}
        />
      </GameShell>
    );
  }

  return (
    <GameShell gameId="smriti-cards" level={level}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center gap-3">
          <VoicePrompt text={t('games.smriti-cards.instructions')} label={t('common.listen')} />
          <p className="text-body text-text-muted">{t('games.smriti-cards.instructions')}</p>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <span className="flex gap-1.5" aria-hidden>
            {Array.from({ length: pairCount }, (_, i) => (
              <span
                key={i}
                className={`h-[22px] w-[22px] rounded-full border-2 border-text transition-colors ${
                  i < matchedCount ? 'bg-primary' : 'bg-transparent'
                }`}
              />
            ))}
          </span>
          <span className="text-body font-semibold">
            {t('games.smriti-cards.pairsFound', { found: matchedCount, total: pairCount })}
          </span>
        </div>

        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, perspective: '900px' }}
        >
          {deck.map((card, index) => {
            const isFaceUp = card.matched || flipped.includes(index);
            const justBurst = burstKeys.has(card.key);
            return (
              <button
                key={card.key}
                onClick={() => handleCardTap(index)}
                disabled={card.matched || busy}
                aria-label={isFaceUp ? card.label : t('common.cardFaceDown')}
                className="tap-target relative aspect-square [transform-style:preserve-3d] transition-transform duration-[460ms] [transition-timing-function:cubic-bezier(0.25,0.85,0.3,1)]"
                style={{ transform: isFaceUp ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
              >
                <span className="absolute inset-0 flex items-center justify-center rounded-card border-[3px] border-text bg-primary [backface-visibility:hidden]">
                  <span className="h-9 w-9 rounded-full border-4 border-primary-text opacity-30" />
                </span>
                <span
                  className="absolute inset-0 flex items-center justify-center rounded-card border-[3px] border-text bg-surface [backface-visibility:hidden]"
                  style={{
                    transform: 'rotateY(180deg)',
                    boxShadow: card.matched ? '0 0 0 7px rgba(0,145,122,0.22)' : undefined,
                    transition: 'box-shadow 450ms ease-out 200ms',
                  }}
                >
                  <Icon name={card.icon} size={36} />
                  {justBurst &&
                    BURST_VECTORS.map(([bx, by], i) => (
                      <span
                        key={i}
                        className="burst-chip"
                        style={
                          {
                            '--bx': `${bx}px`,
                            '--by': `${by}px`,
                            '--burst-color': 'var(--color-primary)',
                          } as CSSProperties
                        }
                      />
                    ))}
                </span>
              </button>
            );
          })}
        </div>

        <div className="card-elderly mt-6 flex flex-wrap items-center gap-4">
          <div className="blob-mascot blob-mascot-inline" aria-hidden>
            <div className="blob-face blob-face-gold">
              <div className="blob-eye blob-eye-l" />
              <div className="blob-eye blob-eye-r" />
              <div className="blob-blush blob-blush-l" />
              <div className="blob-blush blob-blush-r" />
              <div className="blob-mouth" />
            </div>
          </div>
          <p className="flex-1 text-body">
            {t(`games.smriti-cards.${coachKey}`, { name: patient.name })}
          </p>
          <button className="btn-secondary" onClick={() => void startRound(patient.id)}>
            {t('common.startOver')}
          </button>
        </div>
      </div>
    </GameShell>
  );
}
