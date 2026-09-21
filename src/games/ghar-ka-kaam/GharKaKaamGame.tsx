import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GameShell } from '@/components/GameShell';
import { Icon, type IconName } from '@/components/IconSprite';
import { RoundFeedback } from '@/components/RoundFeedback';
import { SessionSummary } from '@/components/SessionSummary';
import { VoicePrompt } from '@/components/VoicePrompt';
import { useActivePatient } from '@/hooks/useActivePatient';
import { useLevelParam } from '@/hooks/useLevelParam';
import { getCurrentLevel, recordGameSession } from '@/engine/gameSessionService';
import { isPersonalBest, type LevelDecision } from '@/engine/adaptiveEngine';
import { useFatigueStore } from '@/store/fatigueStore';
import { shuffle } from '@/lib/shuffle';
import type { ErrorType } from '@/db/types';
import { TOOL_TASK_PAIRS, type ToolTaskPair } from './items';
import { paramsForLevel } from './params';

interface ToolTile {
  key: string;
  id: string;
  icon: IconName;
  label: string;
  correctTask: string | null; // null for distractor tools (no valid match this round)
  matched: boolean;
}

type Phase = 'loading' | 'playing' | 'summary';

function buildRound(level: number): { tools: ToolTile[]; tasks: string[]; pairs: ToolTaskPair[] } {
  const { pairs: pairCount, distractors } = paramsForLevel(level);
  const shuffled = shuffle(TOOL_TASK_PAIRS);
  const pairs = shuffled.slice(0, pairCount);
  const distractorTools = shuffled.slice(pairCount, pairCount + distractors);

  const tools: ToolTile[] = shuffle([
    ...pairs.map((p) => ({ key: p.id, id: p.id, icon: p.toolIcon, label: p.toolLabel, correctTask: p.task, matched: false })),
    ...distractorTools.map((p) => ({ key: `d-${p.id}`, id: p.id, icon: p.toolIcon, label: p.toolLabel, correctTask: null, matched: false })),
  ]);
  const tasks = shuffle(pairs.map((p) => p.task));
  return { tools, tasks, pairs };
}

export default function GharKaKaamGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patient = useActivePatient();
  const levelParam = useLevelParam();
  const recordGamePlayed = useFatigueStore((s) => s.recordGamePlayed);

  const [phase, setPhase] = useState<Phase>('loading');
  const [level, setLevel] = useState(1);
  const [tools, setTools] = useState<ToolTile[]>([]);
  const [tasks, setTasks] = useState<string[]>([]);
  const [matchedTasks, setMatchedTasks] = useState<Set<string>>(new Set());
  const [selectedToolKey, setSelectedToolKey] = useState<string | null>(null);
  const [wrongFlashTask, setWrongFlashTask] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [errorTypes, setErrorTypes] = useState<ErrorType[]>([]);
  const [levelDecision, setLevelDecision] = useState<LevelDecision | null>(null);

  const sessionStartRef = useRef(0);
  const attemptStartRef = useRef(0);
  const totalPairsRef = useRef(0);

  async function startRound(patientId: string, forcedLevel?: number) {
    const currentLevel = forcedLevel ?? (await getCurrentLevel(patientId, 'ghar-ka-kaam'));
    const round = buildRound(currentLevel);
    setLevel(currentLevel);
    setTools(round.tools);
    setTasks(round.tasks);
    totalPairsRef.current = round.pairs.length;
    setMatchedTasks(new Set());
    setSelectedToolKey(null);
    setResponseTimes([]);
    setErrorTypes([]);
    setLevelDecision(null);
    sessionStartRef.current = Date.now();
    attemptStartRef.current = Date.now();
    setPhase('playing');
  }

  useEffect(() => {
    if (patient?.id) void startRound(patient.id, levelParam ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);

  async function finishRound(finalTimes: number[], finalErrors: ErrorType[]) {
    if (!patient) return;
    const correct = finalErrors.filter((e) => e === 'none').length;
    const accuracy = finalErrors.length > 0 ? correct / finalErrors.length : 1;
    const avgResponseMs = finalTimes.length > 0 ? finalTimes.reduce((a, b) => a + b, 0) / finalTimes.length : 0;

    const { levelDecision: decision } = await recordGameSession({
      patientId: patient.id,
      gameId: 'ghar-ka-kaam',
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

  function handleTaskTap(task: string) {
    if (!selectedToolKey || matchedTasks.has(task)) return;
    const tool = tools.find((tl) => tl.key === selectedToolKey);
    if (!tool) return;

    const duration = Date.now() - attemptStartRef.current;
    attemptStartRef.current = Date.now();
    const isCorrect = tool.correctTask === task;
    const nextTimes = [...responseTimes, duration];
    const nextErrors: ErrorType[] = [...errorTypes, isCorrect ? 'none' : 'wrong-choice'];
    setResponseTimes(nextTimes);
    setErrorTypes(nextErrors);

    if (isCorrect) {
      setTools((prev) => prev.map((tl) => (tl.key === selectedToolKey ? { ...tl, matched: true } : tl)));
      const nextMatched = new Set(matchedTasks).add(task);
      setMatchedTasks(nextMatched);
      setSelectedToolKey(null);
      setFeedback('correct');
      window.setTimeout(() => setFeedback(null), 600);
      if (nextMatched.size === totalPairsRef.current) {
        void finishRound(nextTimes, nextErrors);
      }
    } else {
      setWrongFlashTask(task);
      setSelectedToolKey(null);
      setFeedback('wrong');
      window.setTimeout(() => {
        setWrongFlashTask(null);
        setFeedback(null);
      }, 500);
    }
  }

  if (!patient) return null;

  if (phase === 'loading') {
    return (
      <GameShell gameId="ghar-ka-kaam" level={level}>
        <p className="py-20 text-center text-body">{t('common.loading')}</p>
      </GameShell>
    );
  }

  if (phase === 'summary') {
    const correct = errorTypes.filter((e) => e === 'none').length;
    const accuracyPct = errorTypes.length > 0 ? (correct / errorTypes.length) * 100 : 100;
    const displayedLevel = levelDecision?.changed ? levelDecision.newLevel : level;
    return (
      <GameShell gameId="ghar-ka-kaam" level={level}>
        <SessionSummary
          accuracyPct={accuracyPct}
          levelDecision={levelDecision}
          showPersonalBest={isPersonalBest(displayedLevel)}
          onPlayAgain={() => void startRound(patient.id)}
          onGoHome={() => navigate('/patient')}
          onChooseLevel={() => navigate('/patient/game/ghar-ka-kaam/levels')}
        />
      </GameShell>
    );
  }

  return (
    <GameShell gameId="ghar-ka-kaam" level={level} score={matchedTasks.size}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <VoicePrompt text={t('games.ghar-ka-kaam.instructions')} repeatOnInactivity label={t('common.listen')} />
          <p className="text-body text-text-muted">{t('games.ghar-ka-kaam.instructions')}</p>
        </div>

        <RoundFeedback feedback={feedback} />

        <p className="mb-2 text-sm font-semibold text-text-muted">Tools</p>
        <div className="mb-8 flex flex-wrap gap-3">
          {tools.map((tool) => (
            <button
              key={tool.key}
              onClick={() => setSelectedToolKey(tool.key === selectedToolKey ? null : tool.key)}
              disabled={tool.matched}
              aria-label={tool.label}
              className={`tap-target flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-card border-2 transition-colors ${
                tool.matched
                  ? 'border-success bg-surface-alt opacity-40'
                  : selectedToolKey === tool.key
                    ? 'border-accent bg-surface-alt'
                    : 'border-border bg-surface hover:bg-surface-alt'
              }`}
            >
              <Icon name={tool.icon} size={32} />
            </button>
          ))}
        </div>

        <p className="mb-2 text-sm font-semibold text-text-muted">Tasks</p>
        <div className="flex flex-wrap gap-3">
          {tasks.map((task) => (
            <button
              key={task}
              onClick={() => handleTaskTap(task)}
              disabled={matchedTasks.has(task)}
              className={`tap-target rounded-card border-2 px-4 text-body font-semibold transition-colors ${
                matchedTasks.has(task)
                  ? 'border-success bg-surface-alt opacity-40'
                  : wrongFlashTask === task
                    ? 'border-danger bg-surface-alt'
                    : 'border-border bg-surface hover:bg-surface-alt'
              }`}
            >
              {task}
            </button>
          ))}
        </div>
      </div>
    </GameShell>
  );
}
