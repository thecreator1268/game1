import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GameShell } from '@/components/GameShell';
import { SessionSummary } from '@/components/SessionSummary';
import { VoicePrompt } from '@/components/VoicePrompt';
import { Button } from '@/components/Button';
import { useActivePatient } from '@/hooks/useActivePatient';
import { getCurrentLevel, recordGameSession } from '@/engine/gameSessionService';
import { isPersonalBest, type LevelDecision } from '@/engine/adaptiveEngine';
import { useFatigueStore } from '@/store/fatigueStore';
import { shuffle } from '@/lib/shuffle';
import type { ErrorType } from '@/db/types';
import { GROCERY_ITEMS, type GroceryItem } from './items';
import { gridColumnsForSize, paramsForLevel } from './params';

type Phase = 'loading' | 'list' | 'grid' | 'summary';

function buildRound(level: number): { list: GroceryItem[]; grid: GroceryItem[] } {
  const { listLength, gridSize } = paramsForLevel(level);
  const shuffled = shuffle(GROCERY_ITEMS);
  const list = shuffled.slice(0, listLength);
  const rest = shuffled.slice(listLength, gridSize);
  const grid = shuffle([...list, ...rest]);
  return { list, grid };
}

export default function BazaarListGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patient = useActivePatient();
  const recordGamePlayed = useFatigueStore((s) => s.recordGamePlayed);

  const [phase, setPhase] = useState<Phase>('loading');
  const [level, setLevel] = useState(1);
  const [list, setList] = useState<GroceryItem[]>([]);
  const [grid, setGrid] = useState<GroceryItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [levelDecision, setLevelDecision] = useState<LevelDecision | null>(null);
  const [resultAccuracyPct, setResultAccuracyPct] = useState(0);

  const sessionStartRef = useRef(0);
  const gridShownRef = useRef(0);

  async function startRound(patientId: string) {
    const currentLevel = await getCurrentLevel(patientId, 'bazaar-list');
    const round = buildRound(currentLevel);
    setLevel(currentLevel);
    setList(round.list);
    setGrid(round.grid);
    setSelected(new Set());
    setLevelDecision(null);
    sessionStartRef.current = Date.now();
    setPhase('list');
  }

  useEffect(() => {
    if (patient?.id) void startRound(patient.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function checkAnswers() {
    if (!patient) return;
    const listIds = new Set(list.map((i) => i.id));
    const hits = [...selected].filter((id) => listIds.has(id)).length;
    const falsePositives = [...selected].filter((id) => !listIds.has(id)).length;
    const misses = list.length - hits;

    const errorTypes: ErrorType[] = [
      ...Array(hits).fill('none' as ErrorType),
      ...Array(misses).fill('no-response' as ErrorType),
      ...Array(falsePositives).fill('wrong-choice' as ErrorType),
    ];
    const accuracy = Math.max(0, Math.min(1, (hits - falsePositives * 0.5) / list.length));
    const elapsed = Date.now() - gridShownRef.current;
    const avgResponseMs = list.length > 0 ? elapsed / list.length : elapsed;

    const { levelDecision: decision } = await recordGameSession({
      patientId: patient.id,
      gameId: 'bazaar-list',
      level,
      score: Math.round(accuracy * 100),
      accuracy,
      avgResponseMs,
      errorTypes,
      startedAt: sessionStartRef.current,
      endedAt: Date.now(),
    });
    recordGamePlayed();
    setResultAccuracyPct(accuracy * 100);
    setLevelDecision(decision);
    setPhase('summary');
  }

  if (!patient) return null;

  if (phase === 'loading') {
    return (
      <GameShell gameId="bazaar-list" level={level}>
        <p className="py-20 text-center text-body">{t('common.loading')}</p>
      </GameShell>
    );
  }

  if (phase === 'summary') {
    const displayedLevel = levelDecision?.changed ? levelDecision.newLevel : level;
    return (
      <GameShell gameId="bazaar-list" level={level}>
        <SessionSummary
          accuracyPct={resultAccuracyPct}
          levelDecision={levelDecision}
          showPersonalBest={isPersonalBest(displayedLevel)}
          onPlayAgain={() => void startRound(patient.id)}
          onGoHome={() => navigate('/patient')}
        />
      </GameShell>
    );
  }

  if (phase === 'list') {
    return (
      <GameShell gameId="bazaar-list" level={level}>
        <div className="mx-auto max-w-md py-10 text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <VoicePrompt text={list.map((i) => i.label).join(', ')} label={t('common.listen')} />
            <p className="text-body text-text-muted">{t('games.bazaar-list.instructions')}</p>
          </div>
          <div className="card-elderly">
            <div className="flex flex-wrap justify-center gap-4">
              {list.map((item) => (
                <div key={item.id} className="flex flex-col items-center gap-1">
                  <span className="text-4xl">{item.emoji}</span>
                  <span className="text-sm text-text-muted">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <Button
            className="mt-8"
            onClick={() => {
              gridShownRef.current = Date.now();
              setPhase('grid');
            }}
          >
            {t('common.next')}
          </Button>
        </div>
      </GameShell>
    );
  }

  const columns = gridColumnsForSize(grid.length);

  return (
    <GameShell gameId="bazaar-list" level={level} score={selected.size}>
      <div className="mx-auto max-w-2xl">
        <p className="mb-6 text-center text-body text-text-muted">{t('games.bazaar-list.instructions')}</p>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {grid.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleSelect(item.id)}
              aria-pressed={selected.has(item.id)}
              className={`tap-target flex flex-col items-center justify-center gap-1 rounded-card border-2 p-2 transition-colors ${
                selected.has(item.id) ? 'border-accent bg-surface-alt' : 'border-border bg-surface'
              }`}
            >
              <span className="text-3xl">{item.emoji}</span>
              <span className="text-xs text-text-muted">{item.label}</span>
            </button>
          ))}
        </div>
        <Button className="mt-8" onClick={() => void checkAnswers()} disabled={selected.size === 0}>
          {t('common.done')}
        </Button>
      </div>
    </GameShell>
  );
}
