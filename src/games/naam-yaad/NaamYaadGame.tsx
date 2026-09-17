import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { GameShell } from '@/components/GameShell';
import { RoundFeedback } from '@/components/RoundFeedback';
import { SessionSummary } from '@/components/SessionSummary';
import { VoicePrompt } from '@/components/VoicePrompt';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { db } from '@/db/schema';
import { useActivePatient } from '@/hooks/useActivePatient';
import { useLevelParam } from '@/hooks/useLevelParam';
import { getCurrentLevel, recordGameSession } from '@/engine/gameSessionService';
import { isPersonalBest, type LevelDecision } from '@/engine/adaptiveEngine';
import { useFatigueStore } from '@/store/fatigueStore';
import { shuffle } from '@/lib/shuffle';
import { playAudioFallback } from '@/lib/speech';
import { IconButton } from '@/components/IconButton';
import { SpeakerIcon } from '@/components/icons';
import type { ErrorType, FamilyMember } from '@/db/types';
import { FILLER_NAMES, paramsForLevel } from './params';

interface Trial {
  member: FamilyMember;
  options: string[];
}

function buildTrials(members: FamilyMember[], level: number): Trial[] {
  const { shown, options } = paramsForLevel(level);
  const trialCount = Math.min(shown, members.length);
  const targets = shuffle(members).slice(0, Math.max(trialCount, 0));

  return targets.map((target) => {
    const otherRealNames = members.filter((m) => m.id !== target.id).map((m) => m.name);
    const distractorPool = shuffle([...otherRealNames, ...FILLER_NAMES]).filter((n) => n !== target.name);
    const distractors = distractorPool.slice(0, Math.max(options - 1, 0));
    return { member: target, options: shuffle([target.name, ...distractors]) };
  });
}

type Phase = 'loading' | 'playing' | 'summary';

export default function NaamYaadGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patient = useActivePatient();
  const levelParam = useLevelParam();
  const recordGamePlayed = useFatigueStore((s) => s.recordGamePlayed);
  const members = useLiveQuery(
    () => (patient ? db.familyMembers.where('patientId').equals(patient.id).toArray() : []),
    [patient?.id],
    [],
  );

  const [phase, setPhase] = useState<Phase>('loading');
  const [level, setLevel] = useState(1);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [trialIndex, setTrialIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [errorTypes, setErrorTypes] = useState<ErrorType[]>([]);
  const [levelDecision, setLevelDecision] = useState<LevelDecision | null>(null);

  const sessionStartRef = useRef(0);
  const trialStartRef = useRef(0);

  async function startSession(patientId: string, memberList: FamilyMember[], forcedLevel?: number) {
    if (memberList.length === 0) {
      setPhase('playing');
      setTrials([]);
      return;
    }
    const currentLevel = forcedLevel ?? (await getCurrentLevel(patientId, 'naam-yaad'));
    setLevel(currentLevel);
    const round = buildTrials(memberList, currentLevel);
    setTrials(round);
    setTrialIndex(0);
    setCorrectCount(0);
    setResponseTimes([]);
    setErrorTypes([]);
    setFeedback(null);
    setLevelDecision(null);
    sessionStartRef.current = Date.now();
    trialStartRef.current = Date.now();
    setPhase('playing');
  }

  useEffect(() => {
    if (patient?.id && members) void startSession(patient.id, members, levelParam ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id, members?.length]);

  async function finishSession(finalCorrect: number, finalTimes: number[], finalErrors: ErrorType[]) {
    if (!patient) return;
    const accuracy = trials.length > 0 ? finalCorrect / trials.length : 1;
    const avgResponseMs =
      finalTimes.length > 0 ? finalTimes.reduce((a, b) => a + b, 0) / finalTimes.length : 0;

    const { levelDecision: decision } = await recordGameSession({
      patientId: patient.id,
      gameId: 'naam-yaad',
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

  function handleAnswer(name: string) {
    const trial = trials[trialIndex];
    if (!trial || feedback) return;
    const isCorrect = name === trial.member.name;
    const duration = Date.now() - trialStartRef.current;
    const nextTimes = [...responseTimes, duration];
    const nextErrors: ErrorType[] = [...errorTypes, isCorrect ? 'none' : 'wrong-choice'];
    const nextCorrect = correctCount + (isCorrect ? 1 : 0);

    setFeedback(isCorrect ? 'correct' : 'wrong');
    setResponseTimes(nextTimes);
    setErrorTypes(nextErrors);
    setCorrectCount(nextCorrect);

    window.setTimeout(() => {
      if (trialIndex + 1 >= trials.length) {
        void finishSession(nextCorrect, nextTimes, nextErrors);
        return;
      }
      setTrialIndex((i) => i + 1);
      setFeedback(null);
      trialStartRef.current = Date.now();
    }, 900);
  }

  if (!patient) return null;

  if (phase === 'loading' || !members) {
    return (
      <GameShell gameId="naam-yaad" level={level}>
        <p className="py-20 text-center text-body">{t('common.loading')}</p>
      </GameShell>
    );
  }

  if (members.length === 0) {
    return (
      <GameShell gameId="naam-yaad" level={level}>
        <div className="mx-auto max-w-md py-16 text-center">
          <Card>
            <p className="text-body">{t('familyManager.noMembers')}</p>
            <p className="mt-2 text-sm text-text-muted">{t('familyManager.body')}</p>
            <Button className="mt-6" onClick={() => navigate('/patient')}>
              {t('common.home')}
            </Button>
          </Card>
        </div>
      </GameShell>
    );
  }

  if (phase === 'summary') {
    const accuracyPct = trials.length > 0 ? (correctCount / trials.length) * 100 : 100;
    const displayedLevel = levelDecision?.changed ? levelDecision.newLevel : level;
    return (
      <GameShell gameId="naam-yaad" level={level}>
        <SessionSummary
          accuracyPct={accuracyPct}
          levelDecision={levelDecision}
          showPersonalBest={isPersonalBest(displayedLevel)}
          onPlayAgain={() => void startSession(patient.id, members)}
          onGoHome={() => navigate('/patient')}
          onChooseLevel={() => navigate('/patient/game/naam-yaad/levels')}
        />
      </GameShell>
    );
  }

  const trial = trials[trialIndex];
  if (!trial) return null;

  return (
    <GameShell gameId="naam-yaad" level={level} score={correctCount}>
      <div className="mx-auto max-w-md text-center">
        <p className="mb-4 text-sm text-text-muted">
          {trialIndex + 1} / {trials.length}
        </p>

        <img
          src={trial.member.photoUrl}
          alt=""
          className="mx-auto mb-4 h-40 w-40 rounded-full border-4 border-border object-cover"
        />

        <div className="mb-6 flex items-center justify-center gap-3">
          {trial.member.voiceNoteUrl ? (
            <IconButton
              label={t('common.listen')}
              tone="primary"
              onClick={() => void playAudioFallback(trial.member.voiceNoteUrl!)}
            >
              <SpeakerIcon />
            </IconButton>
          ) : (
            <VoicePrompt text={t('games.naam-yaad.instructions')} label={t('common.listen')} />
          )}
          <h2 className="text-heading font-bold">{t('games.naam-yaad.instructions')}</h2>
        </div>

        <div className="flex flex-col gap-3">
          {trial.options.map((name) => (
            <button
              key={name}
              onClick={() => handleAnswer(name)}
              disabled={Boolean(feedback)}
              className={`tap-target rounded-card border-2 px-6 text-action font-semibold transition-colors ${
                feedback && name === trial.member.name
                  ? 'border-success bg-surface-alt'
                  : feedback && name !== trial.member.name
                    ? 'border-border opacity-50'
                    : 'border-border bg-surface hover:bg-surface-alt'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <RoundFeedback feedback={feedback} />
      </div>
    </GameShell>
  );
}
