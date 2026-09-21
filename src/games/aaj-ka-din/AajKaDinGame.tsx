import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GameShell } from '@/components/GameShell';
import { RoundFeedback } from '@/components/RoundFeedback';
import { SessionSummary } from '@/components/SessionSummary';
import { VoicePrompt } from '@/components/VoicePrompt';
import { useActivePatient } from '@/hooks/useActivePatient';
import { recordGameSession } from '@/engine/gameSessionService';
import { useFatigueStore } from '@/store/fatigueStore';
import { shuffle } from '@/lib/shuffle';
import type { ErrorType } from '@/db/types';

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const TIME_KEYS = ['morning', 'afternoon', 'evening', 'night'];
const SEASON_KEYS = ['winter', 'summer', 'monsoon', 'autumn'];

interface Question {
  promptKey: string;
  category: 'days' | 'times' | 'seasons';
  correct: string;
  options: string[];
}

function buildOptions(pool: string[], correct: string, count: number): string[] {
  const distractors = shuffle(pool.filter((k) => k !== correct)).slice(0, count - 1);
  return shuffle([correct, ...distractors]);
}

function buildTodaysQuestions(): Question[] {
  const now = new Date();
  const correctDay = DAY_KEYS[now.getDay()];

  const hour = now.getHours();
  const correctTime = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 20 ? 'evening' : 'night';

  const month = now.getMonth();
  const correctSeason = [11, 0, 1].includes(month)
    ? 'winter'
    : [2, 3, 4, 5].includes(month)
      ? 'summer'
      : [6, 7, 8].includes(month)
        ? 'monsoon'
        : 'autumn';

  return [
    { promptKey: 'whatDay', category: 'days', correct: correctDay, options: buildOptions(DAY_KEYS, correctDay, 3) },
    { promptKey: 'whatTime', category: 'times', correct: correctTime, options: buildOptions(TIME_KEYS, correctTime, 3) },
    {
      promptKey: 'whatSeason',
      category: 'seasons',
      correct: correctSeason,
      options: buildOptions(SEASON_KEYS, correctSeason, 3),
    },
  ];
}

type Phase = 'loading' | 'playing' | 'summary';

// Orientation check-in: deliberately does not use the adaptive engine (see
// games/gameList.ts, usesAdaptiveEngine: false) — it's a once-daily status
// check, not a difficulty drill, so it only ever logs correct/incorrect.
export default function AajKaDinGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patient = useActivePatient();
  const recordGamePlayed = useFatigueStore((s) => s.recordGamePlayed);

  const [phase, setPhase] = useState<Phase>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [errorTypes, setErrorTypes] = useState<ErrorType[]>([]);

  const sessionStartRef = useRef(0);
  const qStartRef = useRef(0);

  function startSession() {
    const qs = buildTodaysQuestions();
    setQuestions(qs);
    setQIndex(0);
    setCorrectCount(0);
    setResponseTimes([]);
    setErrorTypes([]);
    setFeedback(null);
    sessionStartRef.current = Date.now();
    qStartRef.current = Date.now();
    setPhase('playing');
  }

  useEffect(() => {
    if (patient?.id) startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);

  async function finishSession(finalCorrect: number, finalTimes: number[], finalErrors: ErrorType[]) {
    if (!patient) return;
    const accuracy = finalCorrect / questions.length;
    const avgResponseMs =
      finalTimes.length > 0 ? finalTimes.reduce((a, b) => a + b, 0) / finalTimes.length : 0;

    await recordGameSession({
      patientId: patient.id,
      gameId: 'aaj-ka-din',
      level: 1,
      score: Math.round(accuracy * 100),
      accuracy,
      avgResponseMs,
      errorTypes: finalErrors,
      startedAt: sessionStartRef.current,
      endedAt: Date.now(),
    });
    recordGamePlayed();
    setPhase('summary');
  }

  function handleAnswer(option: string) {
    const question = questions[qIndex];
    if (!question || feedback) return;
    const isCorrect = option === question.correct;
    const duration = Date.now() - qStartRef.current;
    const nextTimes = [...responseTimes, duration];
    const nextErrors: ErrorType[] = [...errorTypes, isCorrect ? 'none' : 'wrong-choice'];
    const nextCorrect = correctCount + (isCorrect ? 1 : 0);

    setFeedback(isCorrect ? 'correct' : 'wrong');
    setResponseTimes(nextTimes);
    setErrorTypes(nextErrors);
    setCorrectCount(nextCorrect);

    window.setTimeout(() => {
      if (qIndex + 1 >= questions.length) {
        void finishSession(nextCorrect, nextTimes, nextErrors);
        return;
      }
      setQIndex((i) => i + 1);
      setFeedback(null);
      qStartRef.current = Date.now();
    }, 700);
  }

  if (!patient) return null;

  if (phase === 'loading' || questions.length === 0) {
    return (
      <GameShell gameId="aaj-ka-din" level={1}>
        <p className="py-20 text-center text-body">{t('common.loading')}</p>
      </GameShell>
    );
  }

  if (phase === 'summary') {
    return (
      <GameShell gameId="aaj-ka-din" level={1}>
        <SessionSummary
          accuracyPct={(correctCount / questions.length) * 100}
          levelDecision={null}
          showPersonalBest={false}
          onPlayAgain={startSession}
          onGoHome={() => navigate('/patient')}
        />
      </GameShell>
    );
  }

  const question = questions[qIndex];

  return (
    <GameShell gameId="aaj-ka-din" level={1} score={correctCount}>
      <div className="mx-auto max-w-md text-center">
        <p className="mb-4 text-sm text-text-muted">
          {qIndex + 1} / {questions.length}
        </p>
        <div className="mb-6 flex items-center justify-center gap-3">
          <VoicePrompt text={t(`orientationCheckin.${question.promptKey}`)} label={t('common.listen')} repeatOnInactivity />
          <h2 className="text-heading font-bold">{t(`orientationCheckin.${question.promptKey}`)}</h2>
        </div>

        <div className="flex flex-col gap-3">
          {question.options.map((option) => (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              disabled={Boolean(feedback)}
              className={`tap-target rounded-card border-2 px-6 text-action font-semibold transition-colors ${
                feedback && option === question.correct
                  ? 'border-success bg-surface-alt'
                  : feedback && option !== question.correct
                    ? 'border-border opacity-50'
                    : 'border-border bg-surface hover:bg-surface-alt'
              }`}
            >
              {t(`orientationCheckin.${question.category}.${option}`)}
            </button>
          ))}
        </div>

        <RoundFeedback feedback={feedback} />
      </div>
    </GameShell>
  );
}
