import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GameShell } from '@/components/GameShell';
import { SessionSummary } from '@/components/SessionSummary';
import { VoicePrompt } from '@/components/VoicePrompt';
import { Button } from '@/components/Button';
import { SpeakerIcon } from '@/components/icons';
import { useActivePatient } from '@/hooks/useActivePatient';
import { useLevelParam } from '@/hooks/useLevelParam';
import { getCurrentLevel, recordGameSession } from '@/engine/gameSessionService';
import { isPersonalBest, type LevelDecision } from '@/engine/adaptiveEngine';
import { useFatigueStore } from '@/store/fatigueStore';
import { shuffle } from '@/lib/shuffle';
import { speak } from '@/lib/speech';
import type { ErrorType } from '@/db/types';
import { paramsForLevel, SLOT_DURATION_MS, WORD_POOL } from './params';

interface WordSlot {
  word: string;
  isTarget: boolean;
}

function buildSequence(level: number): { sequence: WordSlot[]; target: string } {
  const { length, targetPct } = paramsForLevel(level);
  const target = WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];
  const targetCount = Math.max(1, Math.round((length * targetPct) / 100));
  const nonTargetPool = WORD_POOL.filter((w) => w !== target);

  const words: WordSlot[] = [];
  for (let i = 0; i < targetCount; i++) words.push({ word: target, isTarget: true });
  for (let i = 0; i < length - targetCount; i++) {
    words.push({ word: nonTargetPool[Math.floor(Math.random() * nonTargetPool.length)], isTarget: false });
  }
  return { sequence: shuffle(words), target };
}

type Phase = 'loading' | 'intro' | 'playing' | 'summary';

// Voice-first, no reading required: the words in the sequence are spoken but
// never shown as text (that would let a reader shortcut the auditory task);
// only the single big response button and a progress count are on screen.
export default function AwaazPehchanGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patient = useActivePatient();
  const levelParam = useLevelParam();
  const recordGamePlayed = useFatigueStore((s) => s.recordGamePlayed);

  const [phase, setPhase] = useState<Phase>('loading');
  const [level, setLevel] = useState(1);
  const [target, setTarget] = useState('');
  const [wordIndex, setWordIndex] = useState(-1);
  const [justTapped, setJustTapped] = useState(false);
  const [levelDecision, setLevelDecision] = useState<LevelDecision | null>(null);
  const [finalAccuracyPct, setFinalAccuracyPct] = useState(0);

  const sequenceRef = useRef<WordSlot[]>([]);
  const errorTypesRef = useRef<ErrorType[]>([]);
  const hitTimesRef = useRef<number[]>([]);
  const tappedThisSlotRef = useRef(false);
  const tapElapsedRef = useRef(0);
  const slotStartRef = useRef(0);
  const sessionStartRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  async function prepareRound(patientId: string, forcedLevel?: number) {
    const currentLevel = forcedLevel ?? (await getCurrentLevel(patientId, 'awaaz-pehchan'));
    const { sequence, target: t2 } = buildSequence(currentLevel);
    setLevel(currentLevel);
    sequenceRef.current = sequence;
    setTarget(t2);
    errorTypesRef.current = [];
    hitTimesRef.current = [];
    setWordIndex(-1);
    setLevelDecision(null);
    setPhase('intro');
  }

  useEffect(() => {
    if (patient?.id) void prepareRound(patient.id, levelParam ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  function resolveSlot(i: number) {
    const slot = sequenceRef.current[i];
    const tapped = tappedThisSlotRef.current;
    let outcome: ErrorType;
    if (slot.isTarget && tapped) {
      outcome = 'none';
      hitTimesRef.current.push(tapElapsedRef.current);
    } else if (slot.isTarget && !tapped) {
      outcome = 'no-response';
    } else if (!slot.isTarget && tapped) {
      outcome = 'wrong-choice';
    } else {
      outcome = 'none';
    }
    errorTypesRef.current.push(outcome);

    if (i + 1 >= sequenceRef.current.length) {
      void finishRound();
    } else {
      scheduleWord(i + 1);
    }
  }

  function scheduleWord(i: number) {
    const slot = sequenceRef.current[i];
    setWordIndex(i);
    setJustTapped(false);
    tappedThisSlotRef.current = false;
    slotStartRef.current = Date.now();
    void speak({ text: slot.word, lang: 'en' });
    timeoutRef.current = window.setTimeout(() => resolveSlot(i), SLOT_DURATION_MS);
  }

  function startSequence() {
    sessionStartRef.current = Date.now();
    setPhase('playing');
    void speak({ text: `Listen for the word: ${target}`, lang: 'en' }).then(() => {
      window.setTimeout(() => scheduleWord(0), 400);
    });
  }

  async function finishRound() {
    if (!patient) return;
    const errors = errorTypesRef.current;
    const correct = errors.filter((e) => e === 'none').length;
    const accuracy = errors.length > 0 ? correct / errors.length : 1;
    const hits = hitTimesRef.current;
    const avgResponseMs = hits.length > 0 ? hits.reduce((a, b) => a + b, 0) / hits.length : SLOT_DURATION_MS / 2;

    const { levelDecision: decision } = await recordGameSession({
      patientId: patient.id,
      gameId: 'awaaz-pehchan',
      level,
      score: Math.round(accuracy * 100),
      accuracy,
      avgResponseMs,
      errorTypes: errors,
      startedAt: sessionStartRef.current,
      endedAt: Date.now(),
    });
    recordGamePlayed();
    setFinalAccuracyPct(accuracy * 100);
    setLevelDecision(decision);
    setPhase('summary');
  }

  function handleTapButton() {
    if (phase !== 'playing' || tappedThisSlotRef.current) return;
    tappedThisSlotRef.current = true;
    tapElapsedRef.current = Date.now() - slotStartRef.current;
    setJustTapped(true);
  }

  if (!patient) return null;

  if (phase === 'loading') {
    return (
      <GameShell gameId="awaaz-pehchan" level={level}>
        <p className="py-20 text-center text-body">{t('common.loading')}</p>
      </GameShell>
    );
  }

  if (phase === 'summary') {
    const displayedLevel = levelDecision?.changed ? levelDecision.newLevel : level;
    return (
      <GameShell gameId="awaaz-pehchan" level={level}>
        <SessionSummary
          accuracyPct={finalAccuracyPct}
          levelDecision={levelDecision}
          showPersonalBest={isPersonalBest(displayedLevel)}
          onPlayAgain={() => void prepareRound(patient.id)}
          onGoHome={() => navigate('/patient')}
          onChooseLevel={() => navigate('/patient/game/awaaz-pehchan/levels')}
        />
      </GameShell>
    );
  }

  if (phase === 'intro') {
    return (
      <GameShell gameId="awaaz-pehchan" level={level}>
        <div className="mx-auto max-w-md py-10 text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <VoicePrompt text={t('games.awaaz-pehchan.instructions')} repeatOnInactivity label={t('common.listen')} />
            <p className="text-body text-text-muted">{t('games.awaaz-pehchan.instructions')}</p>
          </div>
          <div className="card-elderly">
            <p className="text-sm text-text-muted">Listen for the word:</p>
            <p className="mt-2 text-heading-lg font-bold text-primary">{target}</p>
          </div>
          <Button className="mt-8" onClick={startSequence}>
            {t('common.play')}
          </Button>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell gameId="awaaz-pehchan" level={level} score={wordIndex + 1}>
      <div className="mx-auto max-w-md py-10 text-center">
        <p className="mb-6 text-sm text-text-muted">
          {wordIndex + 1} / {sequenceRef.current.length}
        </p>
        <div className="mb-10 flex justify-center">
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-surface-alt text-primary">
            <SpeakerIcon width={52} height={52} />
          </div>
        </div>
        <button
          onClick={handleTapButton}
          className={`tap-target mx-auto flex h-40 w-40 items-center justify-center rounded-full text-action-lg font-bold text-primary-text shadow-card active:scale-95 ${
            justTapped ? 'bg-accent' : 'bg-primary'
          }`}
        >
          {t('common.tapWhenHeard')}
        </button>
      </div>
    </GameShell>
  );
}
