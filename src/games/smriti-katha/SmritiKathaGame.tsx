import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GameShell } from '@/components/GameShell';
import { RoundFeedback } from '@/components/RoundFeedback';
import { SessionSummary } from '@/components/SessionSummary';
import { VoicePrompt } from '@/components/VoicePrompt';
import { Button } from '@/components/Button';
import { useActivePatient } from '@/hooks/useActivePatient';
import { useLevelParam } from '@/hooks/useLevelParam';
import { getCurrentLevel, recordGameSession } from '@/engine/gameSessionService';
import { isPersonalBest, type LevelDecision } from '@/engine/adaptiveEngine';
import { useFatigueStore } from '@/store/fatigueStore';
import { shuffle } from '@/lib/shuffle';
import type { ErrorType } from '@/db/types';
import { STORIES } from './stories';
import { paramsForLevel } from './params';

interface RoundQuestion {
  prompt: string;
  correct: string;
  options: string[];
}

type Phase = 'loading' | 'story' | 'question' | 'summary';

// Voice-first by design: the story and every question can be read aloud on
// demand via the speaker icon (TTS is opt-in everywhere, never automatic —
// see lib/speech.ts), and answers are large tap-only buttons — this must
// work end-to-end for a patient who cannot or does not want to read (see
// README accessibility notes). Story content is English-only in this build
// (see games/registry note in README); UI chrome around it is fully localized.
export default function SmritiKathaGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patient = useActivePatient();
  const levelParam = useLevelParam();
  const recordGamePlayed = useFatigueStore((s) => s.recordGamePlayed);

  const [phase, setPhase] = useState<Phase>('loading');
  const [level, setLevel] = useState(1);
  const [sentences, setSentences] = useState<string[]>([]);
  const [questions, setQuestions] = useState<RoundQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [errorTypes, setErrorTypes] = useState<ErrorType[]>([]);
  const [levelDecision, setLevelDecision] = useState<LevelDecision | null>(null);

  const sessionStartRef = useRef(0);
  const qStartRef = useRef(0);

  async function startSession(patientId: string, forcedLevel?: number) {
    const currentLevel = forcedLevel ?? (await getCurrentLevel(patientId, 'smriti-katha'));
    const { sentences: sCount, questions: qCount } = paramsForLevel(currentLevel);
    const story = STORIES[Math.floor(Math.random() * STORIES.length)];
    const usedSentences = story.sentences.slice(0, sCount);
    const usedQuestions: RoundQuestion[] = shuffle(story.questions)
      .slice(0, qCount)
      .map((q) => ({ prompt: q.promptEn, correct: q.options[0], options: shuffle(q.options) }));

    setLevel(currentLevel);
    setSentences(usedSentences);
    setQuestions(usedQuestions);
    setQIndex(0);
    setCorrectCount(0);
    setResponseTimes([]);
    setErrorTypes([]);
    setFeedback(null);
    setLevelDecision(null);
    sessionStartRef.current = Date.now();
    setPhase('story');
  }

  useEffect(() => {
    if (patient?.id) void startSession(patient.id, levelParam ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);

  useEffect(() => {
    if (phase !== 'question') return;
    const q = questions[qIndex];
    if (!q) return;
    qStartRef.current = Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, qIndex]);

  async function finishSession(finalCorrect: number, finalTimes: number[], finalErrors: ErrorType[]) {
    if (!patient) return;
    const accuracy = questions.length > 0 ? finalCorrect / questions.length : 1;
    const avgResponseMs =
      finalTimes.length > 0 ? finalTimes.reduce((a, b) => a + b, 0) / finalTimes.length : 0;

    const { levelDecision: decision } = await recordGameSession({
      patientId: patient.id,
      gameId: 'smriti-katha',
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

  function handleAnswer(option: string) {
    const q = questions[qIndex];
    if (!q || feedback) return;
    const isCorrect = option === q.correct;
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
    }, 900);
  }

  if (!patient) return null;

  if (phase === 'loading') {
    return (
      <GameShell gameId="smriti-katha" level={level}>
        <p className="py-20 text-center text-body">{t('common.loading')}</p>
      </GameShell>
    );
  }

  if (phase === 'summary') {
    const accuracyPct = questions.length > 0 ? (correctCount / questions.length) * 100 : 100;
    const displayedLevel = levelDecision?.changed ? levelDecision.newLevel : level;
    return (
      <GameShell gameId="smriti-katha" level={level}>
        <SessionSummary
          accuracyPct={accuracyPct}
          levelDecision={levelDecision}
          showPersonalBest={isPersonalBest(displayedLevel)}
          onPlayAgain={() => void startSession(patient.id)}
          onGoHome={() => navigate('/patient')}
          onChooseLevel={() => navigate('/patient/game/smriti-katha/levels')}
        />
      </GameShell>
    );
  }

  if (phase === 'story') {
    return (
      <GameShell gameId="smriti-katha" level={level}>
        <div className="mx-auto max-w-xl text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <VoicePrompt text={sentences.join(' ')} label={t('common.listen')} />
            <h2 className="text-heading font-bold">{t('games.smriti-katha.tagline')}</h2>
          </div>
          <div className="card-elderly text-left">
            {sentences.map((s, i) => (
              <p key={i} className="mb-2 text-body">
                {s}
              </p>
            ))}
          </div>
          <Button className="mt-6" onClick={() => setPhase('question')}>
            {t('common.next')}
          </Button>
        </div>
      </GameShell>
    );
  }

  const q = questions[qIndex];

  return (
    <GameShell gameId="smriti-katha" level={level} score={correctCount}>
      <div className="mx-auto max-w-md text-center">
        <p className="mb-4 text-sm text-text-muted">
          {qIndex + 1} / {questions.length}
        </p>
        <div className="mb-6 flex items-center justify-center gap-3">
          <VoicePrompt
            text={`${q.prompt} ${q.options.map((o, i) => `Option ${i + 1}: ${o}.`).join(' ')}`}
            label={t('common.listen')}
            repeatOnInactivity
          />
          <h2 className="text-heading font-bold">{q.prompt}</h2>
        </div>

        <div className="flex flex-col gap-3">
          {q.options.map((option) => (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              disabled={Boolean(feedback)}
              className={`tap-target rounded-card border-2 px-6 text-action font-semibold transition-colors ${
                feedback && option === q.correct
                  ? 'border-success bg-surface-alt'
                  : feedback && option !== q.correct
                    ? 'border-border opacity-50'
                    : 'border-border bg-surface hover:bg-surface-alt'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <RoundFeedback feedback={feedback} />
      </div>
    </GameShell>
  );
}
