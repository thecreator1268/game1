import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GameShell } from '@/components/GameShell';
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
import { ROUTINE_ITEMS, type RoutineItem } from './items';
import { cardCountForLevel } from './params';

type Phase = 'loading' | 'playing' | 'summary';

function buildRound(level: number): { correctOrder: RoutineItem[]; tray: RoutineItem[] } {
  const count = cardCountForLevel(level);
  const chosen = shuffle(ROUTINE_ITEMS).slice(0, count);
  // Correct order restores each item's position in the canonical daily list.
  const correctOrder = ROUTINE_ITEMS.filter((item) => chosen.some((c) => c.id === item.id));
  return { correctOrder, tray: shuffle(correctOrder) };
}

// Placement (tap source card, then tap an empty slot) instead of continuous
// drag: for a population with common tremor/motor-precision changes, a
// discrete tap is far more reliable than sustained drag tracking, while still
// covering the same "arrange cards" clinical task and keeping "undo" trivial
// (tap a filled slot to send it back to the tray).
export default function DinacharyaSequenceGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patient = useActivePatient();
  const levelParam = useLevelParam();
  const recordGamePlayed = useFatigueStore((s) => s.recordGamePlayed);

  const [phase, setPhase] = useState<Phase>('loading');
  const [level, setLevel] = useState(1);
  const [correctOrder, setCorrectOrder] = useState<RoutineItem[]>([]);
  const [tray, setTray] = useState<RoutineItem[]>([]);
  const [slots, setSlots] = useState<(RoutineItem | null)[]>([]);
  const [selectedTrayId, setSelectedTrayId] = useState<string | null>(null);
  const [levelDecision, setLevelDecision] = useState<LevelDecision | null>(null);
  const [resultAccuracy, setResultAccuracy] = useState(0);

  const sessionStartRef = useRef(0);

  async function startRound(patientId: string) {
    const currentLevel = levelParam ?? (await getCurrentLevel(patientId, 'dinacharya-sequence'));
    const round = buildRound(currentLevel);
    setLevel(currentLevel);
    setCorrectOrder(round.correctOrder);
    setTray(round.tray);
    setSlots(new Array(round.correctOrder.length).fill(null));
    setSelectedTrayId(null);
    setLevelDecision(null);
    sessionStartRef.current = Date.now();
    setPhase('playing');
  }

  useEffect(() => {
    if (patient?.id) void startRound(patient.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);

  function placeInSlot(slotIndex: number) {
    if (!selectedTrayId || slots[slotIndex]) return;
    const item = tray.find((c) => c.id === selectedTrayId);
    if (!item) return;
    setSlots((prev) => prev.map((s, i) => (i === slotIndex ? item : s)));
    setTray((prev) => prev.filter((c) => c.id !== selectedTrayId));
    setSelectedTrayId(null);
  }

  function removeFromSlot(slotIndex: number) {
    const item = slots[slotIndex];
    if (!item) return;
    setSlots((prev) => prev.map((s, i) => (i === slotIndex ? null : s)));
    setTray((prev) => [...prev, item]);
  }

  async function checkOrder() {
    if (!patient) return;
    const errorTypes: ErrorType[] = slots.map((s, i) => (s && s.id === correctOrder[i].id ? 'none' : 'sequence-error'));
    const correctCount = errorTypes.filter((e) => e === 'none').length;
    const accuracy = correctOrder.length > 0 ? correctCount / correctOrder.length : 1;
    const elapsed = Date.now() - sessionStartRef.current;
    const avgResponseMs = correctOrder.length > 0 ? elapsed / correctOrder.length : elapsed;

    const { levelDecision: decision } = await recordGameSession({
      patientId: patient.id,
      gameId: 'dinacharya-sequence',
      level,
      score: Math.round(accuracy * 100),
      accuracy,
      avgResponseMs,
      errorTypes,
      startedAt: sessionStartRef.current,
      endedAt: Date.now(),
    });
    recordGamePlayed();
    setResultAccuracy(accuracy * 100);
    setLevelDecision(decision);
    setPhase('summary');
  }

  if (!patient) return null;

  if (phase === 'loading') {
    return (
      <GameShell gameId="dinacharya-sequence" level={level}>
        <p className="py-20 text-center text-body">{t('common.loading')}</p>
      </GameShell>
    );
  }

  if (phase === 'summary') {
    const displayedLevel = levelDecision?.changed ? levelDecision.newLevel : level;
    return (
      <GameShell gameId="dinacharya-sequence" level={level}>
        <SessionSummary
          accuracyPct={resultAccuracy}
          levelDecision={levelDecision}
          showPersonalBest={isPersonalBest(displayedLevel)}
          onPlayAgain={() => void startRound(patient.id)}
          onGoHome={() => navigate('/patient')}
          onChooseLevel={() => navigate('/patient/game/dinacharya-sequence/levels')}
        />
      </GameShell>
    );
  }

  const allFilled = slots.every((s) => s !== null);

  return (
    <GameShell gameId="dinacharya-sequence" level={level}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <VoicePrompt text={t('games.dinacharya-sequence.instructions')} label={t('common.listen')} />
          <p className="text-body text-text-muted">{t('games.dinacharya-sequence.instructions')}</p>
        </div>

        <p className="mb-2 text-sm font-semibold text-text-muted">Order (tap a card below, then tap a box)</p>
        <div className="mb-8 flex flex-wrap gap-3">
          {slots.map((item, index) => (
            <button
              key={index}
              onClick={() => (item ? removeFromSlot(index) : placeInSlot(index))}
              className={`tap-target flex h-20 w-20 flex-col items-center justify-center rounded-card border-2 text-3xl ${
                item ? 'border-primary bg-surface-alt' : 'border-dashed border-border bg-surface'
              }`}
              aria-label={item ? item.label : `Empty slot ${index + 1}`}
            >
              {item ? item.emoji : index + 1}
            </button>
          ))}
        </div>

        <p className="mb-2 text-sm font-semibold text-text-muted">Cards</p>
        <div className="mb-8 flex flex-wrap gap-3">
          {tray.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedTrayId(item.id === selectedTrayId ? null : item.id)}
              className={`tap-target flex h-20 w-20 flex-col items-center justify-center rounded-card border-2 text-3xl transition-colors ${
                selectedTrayId === item.id ? 'border-accent bg-surface-alt' : 'border-border bg-surface'
              }`}
              aria-label={item.label}
            >
              {item.emoji}
            </button>
          ))}
        </div>

        <Button onClick={() => void checkOrder()} disabled={!allFilled}>
          {t('common.done')}
        </Button>
      </div>
    </GameShell>
  );
}
