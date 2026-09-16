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
import { gridColumnsForLength, paramsForLevel } from './params';

interface Tile {
  key: string;
  value: number;
  status: 'idle' | 'done' | 'wrong';
}

function buildRound(level: number): Tile[] {
  const { length, step } = paramsForLevel(level);
  const start = 1 + Math.floor(Math.random() * 5);
  const values = Array.from({ length }, (_, i) => start + i * step);
  return shuffle(values.map((v) => ({ key: `n-${v}-${Math.random()}`, value: v, status: 'idle' as const })));
}

type Phase = 'loading' | 'playing' | 'summary';

export default function GintiDhyanGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patient = useActivePatient();
  const levelParam = useLevelParam();
  const recordGamePlayed = useFatigueStore((s) => s.recordGamePlayed);

  const [phase, setPhase] = useState<Phase>('loading');
  const [level, setLevel] = useState(1);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [nextIndex, setNextIndex] = useState(0);
  const [tapDurations, setTapDurations] = useState<number[]>([]);
  const [errorTypes, setErrorTypes] = useState<ErrorType[]>([]);
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);
  const [levelDecision, setLevelDecision] = useState<LevelDecision | null>(null);

  const sessionStartRef = useRef(0);
  const stepStartRef = useRef(0);
  const sortedValuesRef = useRef<number[]>([]);

  async function startRound(patientId: string, forcedLevel?: number) {
    const currentLevel = forcedLevel ?? (await getCurrentLevel(patientId, 'ginti-dhyan'));
    const round = buildRound(currentLevel);
    setLevel(currentLevel);
    setTiles(round);
    sortedValuesRef.current = [...round.map((t) => t.value)].sort((a, b) => a - b);
    setNextIndex(0);
    setTapDurations([]);
    setErrorTypes([]);
    setLevelDecision(null);
    setWrongFlash(null);
    sessionStartRef.current = Date.now();
    stepStartRef.current = Date.now();
    setPhase('playing');
  }

  useEffect(() => {
    if (patient?.id) void startRound(patient.id, levelParam ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);

  async function finishRound(finalTiles: Tile[], finalTimes: number[], finalErrors: ErrorType[]) {
    if (!patient) return;
    const correct = finalTiles.length;
    const wrong = finalErrors.filter((e) => e === 'sequence-error').length;
    const accuracy = correct + wrong > 0 ? correct / (correct + wrong) : 1;
    const avgResponseMs = finalTimes.length > 0 ? finalTimes.reduce((a, b) => a + b, 0) / finalTimes.length : 0;

    const { levelDecision: decision } = await recordGameSession({
      patientId: patient.id,
      gameId: 'ginti-dhyan',
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

  function handleTap(index: number) {
    if (phase !== 'playing') return;
    const tile = tiles[index];
    if (tile.status !== 'idle') return;

    const expected = sortedValuesRef.current[nextIndex];
    if (tile.value === expected) {
      const duration = Date.now() - stepStartRef.current;
      stepStartRef.current = Date.now();
      const nextTimes = [...tapDurations, duration];
      const nextErrors: ErrorType[] = [...errorTypes, 'none'];
      const nextTiles = tiles.map((tl, i) => (i === index ? { ...tl, status: 'done' as const } : tl));
      setTiles(nextTiles);
      setTapDurations(nextTimes);
      setErrorTypes(nextErrors);

      const newNextIndex = nextIndex + 1;
      setNextIndex(newNextIndex);

      if (newNextIndex >= sortedValuesRef.current.length) {
        void finishRound(nextTiles.filter((t) => t.status === 'done'), nextTimes, nextErrors);
      }
    } else {
      setErrorTypes((prev) => [...prev, 'sequence-error']);
      setWrongFlash(tile.key);
      window.setTimeout(() => setWrongFlash(null), 500);
    }
  }

  if (!patient) return null;

  if (phase === 'loading') {
    return (
      <GameShell gameId="ginti-dhyan" level={level}>
        <p className="py-20 text-center text-body">{t('common.loading')}</p>
      </GameShell>
    );
  }

  if (phase === 'summary') {
    const correct = tiles.filter((t) => t.status === 'done').length;
    const wrong = errorTypes.filter((e) => e === 'sequence-error').length;
    const accuracyPct = correct + wrong > 0 ? (correct / (correct + wrong)) * 100 : 100;
    const displayedLevel = levelDecision?.changed ? levelDecision.newLevel : level;
    return (
      <GameShell gameId="ginti-dhyan" level={level}>
        <SessionSummary
          accuracyPct={accuracyPct}
          levelDecision={levelDecision}
          showPersonalBest={isPersonalBest(displayedLevel)}
          onPlayAgain={() => void startRound(patient.id)}
          onGoHome={() => navigate('/patient')}
          onChooseLevel={() => navigate('/patient/game/ginti-dhyan/levels')}
        />
      </GameShell>
    );
  }

  const columns = gridColumnsForLength(tiles.length);

  return (
    <GameShell gameId="ginti-dhyan" level={level} score={nextIndex}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <VoicePrompt text={t('games.ginti-dhyan.instructions')} label={t('common.listen')} />
          <p className="text-body text-text-muted">{t('games.ginti-dhyan.instructions')}</p>
        </div>

        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {tiles.map((tile, index) => (
            <button
              key={tile.key}
              onClick={() => handleTap(index)}
              disabled={tile.status === 'done'}
              className={`tap-target flex aspect-square items-center justify-center rounded-card border-2 text-2xl font-bold transition-colors ${
                tile.status === 'done'
                  ? 'border-success bg-surface-alt text-text-muted opacity-50'
                  : wrongFlash === tile.key
                    ? 'border-danger bg-surface-alt'
                    : 'border-border bg-surface hover:bg-surface-alt'
              }`}
            >
              {tile.value}
            </button>
          ))}
        </div>
      </div>
    </GameShell>
  );
}
