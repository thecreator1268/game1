import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GameShell } from '@/components/GameShell';
import { SessionSummary } from '@/components/SessionSummary';
import { VoicePrompt } from '@/components/VoicePrompt';
import { useActivePatient } from '@/hooks/useActivePatient';
import { useLevelParam } from '@/hooks/useLevelParam';
import { getCurrentLevel, recordGameSession } from '@/engine/gameSessionService';
import { isPersonalBest, type LevelDecision } from '@/engine/adaptiveEngine';
import { useFatigueStore } from '@/store/fatigueStore';
import { shuffle } from '@/lib/shuffle';
import type { ErrorType } from '@/db/types';
import { distractorsForLevel, OBJECT_POOL, TRIALS_PER_SESSION } from './params';

interface Trial {
  target: string;
  options: string[];
}

function buildTrial(level: number): Trial {
  const distractorCount = distractorsForLevel(level);
  const pool = shuffle(OBJECT_POOL);
  const target = pool[0];
  const distractors = pool.slice(1, 1 + distractorCount);
  return { target, options: shuffle([target, ...distractors]) };
}

type Phase = 'loading' | 'playing' | 'summary';

// "Shadows" are the same emoji rendered as solid silhouettes (filter:
// brightness(0)) — no illustration assets needed, and it genuinely strips
// color so the match has to be made on shape alone.
export default function ChayaKhojGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patient = useActivePatient();
  const levelParam = useLevelParam();
  const recordGamePlayed = useFatigueStore((s) => s.recordGamePlayed);

  const [phase, setPhase] = useState<Phase>('loading');
  const [level, setLevel] = useState(1);
  const [trialIndex, setTrialIndex] = useState(0);
  const [trial, setTrial] = useState<Trial | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [errorTypes, setErrorTypes] = useState<ErrorType[]>([]);
  const [levelDecision, setLevelDecision] = useState<LevelDecision | null>(null);

  const sessionStartRef = useRef(0);
  const trialStartRef = useRef(0);

  async function startSession(patientId: string, forcedLevel?: number) {
    const currentLevel = forcedLevel ?? (await getCurrentLevel(patientId, 'chaya-khoj'));
    setLevel(currentLevel);
    setTrialIndex(0);
    setCorrectCount(0);
    setResponseTimes([]);
    setErrorTypes([]);
    setLevelDecision(null);
    setFeedback(null);
    setTrial(buildTrial(currentLevel));
    sessionStartRef.current = Date.now();
    trialStartRef.current = Date.now();
    setPhase('playing');
  }

  useEffect(() => {
    if (patient?.id) void startSession(patient.id, levelParam ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);

  async function finishSession(finalCorrect: number, finalTimes: number[], finalErrors: ErrorType[]) {
    if (!patient) return;
    const accuracy = finalCorrect / TRIALS_PER_SESSION;
    const avgResponseMs = finalTimes.length > 0 ? finalTimes.reduce((a, b) => a + b, 0) / finalTimes.length : 0;

    const { levelDecision: decision } = await recordGameSession({
      patientId: patient.id,
      gameId: 'chaya-khoj',
      level,
      score: Math.round(accuracy * 100),
      accuracy,
      avgResponseMs,
      errorTypes: finalErrors,
      startedAt: sessionStartRef.current,
      endedAt: Date.now(),
    });
    recordGamePlayed();
    setLevelDecision(decision);
    setPhase('summary');
  }

  function handleOptionTap(shadow: string) {
    if (!trial || feedback) return;
    const isCorrect = shadow === trial.target;
    const duration = Date.now() - trialStartRef.current;
    const nextTimes = [...responseTimes, duration];
    const nextErrors: ErrorType[] = [...errorTypes, isCorrect ? 'none' : 'wrong-choice'];
    const nextCorrect = correctCount + (isCorrect ? 1 : 0);

    setFeedback(isCorrect ? 'correct' : 'wrong');
    setResponseTimes(nextTimes);
    setErrorTypes(nextErrors);
    setCorrectCount(nextCorrect);

    window.setTimeout(() => {
      if (trialIndex + 1 >= TRIALS_PER_SESSION) {
        void finishSession(nextCorrect, nextTimes, nextErrors);
        return;
      }
      setTrialIndex((i) => i + 1);
      setTrial(buildTrial(level));
      setFeedback(null);
      trialStartRef.current = Date.now();
    }, 700);
  }

  if (!patient) return null;

  if (phase === 'loading' || !trial) {
    return (
      <GameShell gameId="chaya-khoj" level={level}>
        <p className="py-20 text-center text-body">{t('common.loading')}</p>
      </GameShell>
    );
  }

  if (phase === 'summary') {
    const accuracyPct = (correctCount / TRIALS_PER_SESSION) * 100;
    const displayedLevel = levelDecision?.changed ? levelDecision.newLevel : level;
    return (
      <GameShell gameId="chaya-khoj" level={level}>
        <SessionSummary
          accuracyPct={accuracyPct}
          levelDecision={levelDecision}
          showPersonalBest={isPersonalBest(displayedLevel)}
          onPlayAgain={() => void startSession(patient.id)}
          onGoHome={() => navigate('/patient')}
          onChooseLevel={() => navigate('/patient/game/chaya-khoj/levels')}
        />
      </GameShell>
    );
  }

  return (
    <GameShell gameId="chaya-khoj" level={level} score={correctCount}>
      <div className="mx-auto max-w-md text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <VoicePrompt text={t('games.chaya-khoj.instructions')} label={t('common.listen')} />
          <p className="text-body text-text-muted">{t('games.chaya-khoj.instructions')}</p>
        </div>
        <p className="mb-4 text-sm text-text-muted">
          {trialIndex + 1} / {TRIALS_PER_SESSION}
        </p>

        <div className="mb-8 flex justify-center">
          <span className="text-7xl" aria-label="object">
            {trial.target}
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {trial.options.map((shadow, index) => (
            <button
              key={`${shadow}-${index}`}
              onClick={() => handleOptionTap(shadow)}
              disabled={Boolean(feedback)}
              className={`tap-target flex h-20 w-20 items-center justify-center rounded-card border-2 text-4xl transition-colors ${
                feedback && shadow === trial.target
                  ? 'border-success bg-surface-alt'
                  : feedback
                    ? 'border-border opacity-50'
                    : 'border-border bg-surface hover:bg-surface-alt'
              }`}
              style={{ filter: 'brightness(0)' }}
            >
              {shadow}
            </button>
          ))}
        </div>

        {feedback && (
          <p className={`mt-4 text-body font-semibold ${feedback === 'correct' ? 'text-success' : 'text-danger'}`}>
            {feedback === 'correct' ? t('common.correct') : t('common.tryAgain')}
          </p>
        )}
      </div>
    </GameShell>
  );
}
