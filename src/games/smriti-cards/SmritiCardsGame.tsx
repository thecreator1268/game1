import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GameShell } from '@/components/GameShell';
import { SessionSummary } from '@/components/SessionSummary';
import { VoicePrompt } from '@/components/VoicePrompt';
import { useActivePatient } from '@/hooks/useActivePatient';
import { getCurrentLevel, recordGameSession } from '@/engine/gameSessionService';
import { isPersonalBest, type LevelDecision } from '@/engine/adaptiveEngine';
import { useFatigueStore } from '@/store/fatigueStore';
import type { ErrorType } from '@/db/types';
import { CARD_ITEMS } from './items';
import { gridColumnsForPairCount, pairsForLevel } from './params';

interface DeckCard {
  key: string;
  itemId: string;
  emoji: string;
  label: string;
  matched: boolean;
}

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
      emoji: item.emoji,
      label: item.label,
      matched: false,
    },
    {
      key: `${item.id}-b-${idx}`,
      itemId: item.id,
      emoji: item.emoji,
      label: item.label,
      matched: false,
    },
  ]);
  return shuffle(cards);
}

type Phase = 'loading' | 'playing' | 'summary';
const MISMATCH_PAUSE_MS = 900;
const MATCH_PAUSE_MS = 450;

export default function SmritiCardsGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patient = useActivePatient();
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

  const sessionStartRef = useRef(0);
  const guessStartRef = useRef(0);

  const pairCount = useMemo(() => pairsForLevel(level), [level]);
  const columns = gridColumnsForPairCount(pairCount);

  async function startRound(patientId: string) {
    const currentLevel = await getCurrentLevel(patientId, 'smriti-cards');
    setLevel(currentLevel);
    setDeck(buildDeck(pairsForLevel(currentLevel)));
    setFlipped([]);
    setBusy(false);
    setMatchedCount(0);
    setGuessDurations([]);
    setErrorTypes([]);
    setLevelDecision(null);
    sessionStartRef.current = Date.now();
    guessStartRef.current = Date.now();
    setPhase('playing');
  }

  useEffect(() => {
    if (patient?.id) void startRound(patient.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);

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
            setMatchedCount((prev) => prev + 1);
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
        />
      </GameShell>
    );
  }

  return (
    <GameShell gameId="smriti-cards" level={level}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <VoicePrompt text={t('games.smriti-cards.instructions')} label={t('common.listen')} />
          <p className="text-body text-text-muted">{t('games.smriti-cards.instructions')}</p>
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {deck.map((card, index) => {
            const isFaceUp = card.matched || flipped.includes(index);
            return (
              <button
                key={card.key}
                onClick={() => handleCardTap(index)}
                disabled={card.matched || busy}
                aria-label={isFaceUp ? card.label : t('common.cardFaceDown')}
                className={`tap-target flex aspect-square items-center justify-center rounded-card border-2 text-4xl transition-colors active:scale-[0.97] ${
                  card.matched
                    ? 'border-success bg-surface-alt'
                    : isFaceUp
                      ? 'border-primary bg-surface-alt'
                      : 'border-primary bg-primary text-primary-text'
                }`}
              >
                {isFaceUp ? card.emoji : ''}
              </button>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
}
