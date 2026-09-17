import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GameShell } from '@/components/GameShell';
import { RoundFeedback } from '@/components/RoundFeedback';
import { SessionSummary } from '@/components/SessionSummary';
import { VoicePrompt } from '@/components/VoicePrompt';
import { useActivePatient } from '@/hooks/useActivePatient';
import { useLevelParam } from '@/hooks/useLevelParam';
import { getCurrentLevel, recordGameSession } from '@/engine/gameSessionService';
import { isPersonalBest, type LevelDecision } from '@/engine/adaptiveEngine';
import { useFatigueStore } from '@/store/fatigueStore';
import type { ErrorType } from '@/db/types';
import { ClockFace } from './ClockFace';
import { buildClockTrial, formatClockTime, type ClockTrial, TRIALS_PER_SESSION } from './params';

type Phase = 'loading' | 'playing' | 'summary';

export default function GhadiDekhoGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patient = useActivePatient();
  const levelParam = useLevelParam();
  const recordGamePlayed = useFatigueStore((s) => s.recordGamePlayed);

  const [phase, setPhase] = useState<Phase>('loading');
  const [level, setLevel] = useState(1);
  const [trialIndex, setTrialIndex] = useState(0);
  const [trial, setTrial] = useState<ClockTrial | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [errorTypes, setErrorTypes] = useState<ErrorType[]>([]);
  const [levelDecision, setLevelDecision] = useState<LevelDecision | null>(null);

  const sessionStartRef = useRef(0);
  const trialStartRef = useRef(0);

  async function startSession(patientId: string, forcedLevel?: number) {
    const currentLevel = forcedLevel ?? (await getCurrentLevel(patientId, 'ghadi-dekho'));
    setLevel(currentLevel);
    setTrialIndex(0);
    setCorrectCount(0);
    setResponseTimes([]);
    setErrorTypes([]);
    setLevelDecision(null);
    setFeedback(null);
    setTrial(buildClockTrial(currentLevel));
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
    const avgResponseMs =
      finalTimes.length > 0 ? finalTimes.reduce((a, b) => a + b, 0) / finalTimes.length : 0;

    const { levelDecision: decision } = await recordGameSession({
      patientId: patient.id,
      gameId: 'ghadi-dekho',
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

  function handleOptionTap(minutes: number) {
    if (!trial || feedback) return;
    const isCorrect = minutes === trial.totalMinutes;
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
      setTrial(buildClockTrial(level));
      setFeedback(null);
      trialStartRef.current = Date.now();
    }, 900);
  }

  if (!patient) return null;

  if (phase === 'loading' || !trial) {
    return (
      <GameShell gameId="ghadi-dekho" level={level}>
        <p className="py-20 text-center text-body">{t('common.loading')}</p>
      </GameShell>
    );
  }

  if (phase === 'summary') {
    const accuracyPct = (correctCount / TRIALS_PER_SESSION) * 100;
    const displayedLevel = levelDecision?.changed ? levelDecision.newLevel : level;
    return (
      <GameShell gameId="ghadi-dekho" level={level}>
        <SessionSummary
          accuracyPct={accuracyPct}
          levelDecision={levelDecision}
          showPersonalBest={isPersonalBest(displayedLevel)}
          onPlayAgain={() => void startSession(patient.id)}
          onGoHome={() => navigate('/patient')}
          onChooseLevel={() => navigate('/patient/game/ghadi-dekho/levels')}
        />
      </GameShell>
    );
  }

  return (
    <GameShell gameId="ghadi-dekho" level={level} score={correctCount}>
      <div className="mx-auto max-w-md text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <VoicePrompt text={t('games.ghadi-dekho.instructions')} label={t('common.listen')} />
          <p className="text-body text-text-muted">{t('games.ghadi-dekho.instructions')}</p>
        </div>
        <p className="mb-4 text-sm text-text-muted">
          {trialIndex + 1} / {TRIALS_PER_SESSION}
        </p>

        <div className="mb-8 flex justify-center">
          <ClockFace totalMinutes={trial.totalMinutes} />
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {trial.optionsMinutes.map((minutes) => (
            <button
              key={minutes}
              onClick={() => handleOptionTap(minutes)}
              disabled={Boolean(feedback)}
              className={`tap-target flex min-w-24 items-center justify-center rounded-card border-2 px-4 text-action font-bold transition-colors ${
                feedback && minutes === trial.totalMinutes
                  ? 'border-success bg-surface-alt'
                  : feedback && minutes !== trial.totalMinutes
                    ? 'border-border opacity-50'
                    : 'border-border bg-surface hover:bg-surface-alt'
              }`}
            >
              {formatClockTime(minutes)}
            </button>
          ))}
        </div>

        <RoundFeedback feedback={feedback} />
      </div>
    </GameShell>
  );
}
