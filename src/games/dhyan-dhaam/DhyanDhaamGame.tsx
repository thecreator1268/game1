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
import { shuffle } from '@/lib/shuffle';
import type { ErrorType } from '@/db/types';
import { gridColumnsForSize, PATTERN_COLORS, paramsForLevel } from './params';

interface Tile {
  key: string;
  colorId: string;
  hex: string;
  isTarget: boolean;
  status: 'idle' | 'correct' | 'wrong';
}

function buildRound(level: number): { tiles: Tile[]; targetHex: string } {
  const { gridSize, distractorPct } = paramsForLevel(level);
  const targetColor = PATTERN_COLORS[Math.floor(Math.random() * PATTERN_COLORS.length)];
  const distractorCount = Math.round((gridSize * distractorPct) / 100);
  const targetCount = Math.max(1, gridSize - distractorCount);
  const otherColors = PATTERN_COLORS.filter((c) => c.id !== targetColor.id);

  const tiles: Tile[] = [];
  for (let i = 0; i < targetCount; i++) {
    tiles.push({ key: `t-${i}`, colorId: targetColor.id, hex: targetColor.hex, isTarget: true, status: 'idle' });
  }
  for (let i = 0; i < distractorCount; i++) {
    const c = otherColors[Math.floor(Math.random() * otherColors.length)];
    tiles.push({ key: `d-${i}-${c.id}`, colorId: c.id, hex: c.hex, isTarget: false, status: 'idle' });
  }
  return { tiles: shuffle(tiles), targetHex: targetColor.hex };
}

type Phase = 'loading' | 'playing' | 'summary';

export default function DhyanDhaamGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patient = useActivePatient();
  const recordGamePlayed = useFatigueStore((s) => s.recordGamePlayed);

  const [phase, setPhase] = useState<Phase>('loading');
  const [level, setLevel] = useState(1);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [targetHex, setTargetHex] = useState('#b8440e');
  const [foundCount, setFoundCount] = useState(0);
  const [tapDurations, setTapDurations] = useState<number[]>([]);
  const [errorTypes, setErrorTypes] = useState<ErrorType[]>([]);
  const [levelDecision, setLevelDecision] = useState<LevelDecision | null>(null);

  const sessionStartRef = useRef(0);
  const lastTapRef = useRef(0);

  const targetTotal = useMemo(() => tiles.filter((tl) => tl.isTarget).length, [tiles]);
  const columns = gridColumnsForSize(tiles.length || paramsForLevel(level).gridSize);

  async function startRound(patientId: string) {
    const currentLevel = await getCurrentLevel(patientId, 'dhyan-dhaam');
    const round = buildRound(currentLevel);
    setLevel(currentLevel);
    setTiles(round.tiles);
    setTargetHex(round.targetHex);
    setFoundCount(0);
    setTapDurations([]);
    setErrorTypes([]);
    setLevelDecision(null);
    sessionStartRef.current = Date.now();
    lastTapRef.current = Date.now();
    setPhase('playing');
  }

  useEffect(() => {
    if (patient?.id) void startRound(patient.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);

  async function finishRound(finalTiles: Tile[]) {
    if (!patient) return;
    const correct = finalTiles.filter((tl) => tl.status === 'correct').length;
    const wrong = finalTiles.filter((tl) => tl.status === 'wrong').length;
    const totalTaps = correct + wrong;
    const accuracy = totalTaps > 0 ? correct / totalTaps : 1;
    const avgResponseMs =
      tapDurations.length > 0 ? tapDurations.reduce((a, b) => a + b, 0) / tapDurations.length : 0;

    const { levelDecision: decision } = await recordGameSession({
      patientId: patient.id,
      gameId: 'dhyan-dhaam',
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

  function handleTileTap(index: number) {
    if (phase !== 'playing') return;
    const tile = tiles[index];
    if (tile.status !== 'idle') return;

    const now = Date.now();
    const duration = now - lastTapRef.current;
    lastTapRef.current = now;
    setTapDurations((prev) => [...prev, duration]);

    const nextTiles = tiles.map((tl, i) =>
      i === index ? { ...tl, status: (tl.isTarget ? 'correct' : 'wrong') as Tile['status'] } : tl,
    );
    setTiles(nextTiles);
    setErrorTypes((prev) => [...prev, tile.isTarget ? 'none' : 'wrong-choice']);

    if (tile.isTarget) {
      const newFoundCount = foundCount + 1;
      setFoundCount(newFoundCount);
      if (newFoundCount === targetTotal) {
        void finishRound(nextTiles);
      }
    }
  }

  if (!patient) return null;

  if (phase === 'loading') {
    return (
      <GameShell gameId="dhyan-dhaam" level={level}>
        <p className="py-20 text-center text-body">{t('common.loading')}</p>
      </GameShell>
    );
  }

  if (phase === 'summary') {
    const correct = tiles.filter((tl) => tl.status === 'correct').length;
    const wrong = tiles.filter((tl) => tl.status === 'wrong').length;
    const totalTaps = correct + wrong;
    const accuracyPct = totalTaps > 0 ? (correct / totalTaps) * 100 : 100;
    const displayedLevel = levelDecision?.changed ? levelDecision.newLevel : level;
    return (
      <GameShell gameId="dhyan-dhaam" level={level}>
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
    <GameShell gameId="dhyan-dhaam" level={level} score={foundCount}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center gap-3">
          <VoicePrompt text={t('games.dhyan-dhaam.instructions')} label={t('common.listen')} />
          <p className="text-body text-text-muted">{t('games.dhyan-dhaam.instructions')}</p>
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-card border-2 border-border bg-surface-alt p-4">
          <span className="text-sm text-text-muted">Target:</span>
          <span
            aria-label="Target pattern"
            className="inline-block h-10 w-10 rotate-45 rounded-md"
            style={{ backgroundColor: targetHex }}
          />
          <span className="text-sm text-text-muted">
            {foundCount} / {targetTotal}
          </span>
        </div>

        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {tiles.map((tile, index) => (
            <button
              key={tile.key}
              onClick={() => handleTileTap(index)}
              disabled={tile.status !== 'idle'}
              aria-label="pattern tile"
              className={`tap-target flex aspect-square items-center justify-center rounded-card border-2 transition-opacity active:scale-[0.95] ${
                tile.status === 'wrong' ? 'border-danger opacity-40' : 'border-border'
              } ${tile.status === 'correct' ? 'opacity-30' : ''}`}
            >
              <span
                className="h-8 w-8 rotate-45 rounded-md"
                style={{ backgroundColor: tile.hex }}
                aria-hidden
              />
            </button>
          ))}
        </div>
      </div>
    </GameShell>
  );
}
